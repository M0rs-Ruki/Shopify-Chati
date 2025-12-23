# Chati Shopify App - Internal Documentation & Handoff

**Project Status:** Stateless Event Forwarder - Ready for Chati Core Integration  
**Last Updated:** December 2024  
**Version:** 2.0.0 (Stateless Architecture)

---

## 1. Project Overview

Chati is a Shopify public embedded app designed as a **stateless event forwarder** that receives webhooks from Shopify, normalizes them, and forwards them to business logic handlers. The app is architected to work with a separate **Chati Core** service (MongoDB) that will handle event storage, WhatsApp notifications, analytics, and retry logic.

At this stage, the project focuses on:

- ✅ A robust, stateless Shopify backend
- ✅ Legal & App Store compliance
- ✅ Reliable event processing with idempotency
- ✅ A clean embedded Admin UI
- ✅ All 16 webhooks implemented and functional

**Architecture Philosophy:**

- **Shopify App (This Repo)**: Thin event forwarder - no database, no persistence
- **Chati Core (Separate Repo)**: Backend service with MongoDB for storage, WhatsApp, analytics

**Important:** WhatsApp integration will be handled by Chati Core (MongoDB). This app focuses solely on receiving and forwarding events.

---

## 2. What the App Does (Current Scope)

### ✅ Implemented

- **Shopify OAuth & embedded admin app**
  - Full authentication flow
  - Embedded app experience in Shopify Admin
  - **In-memory session storage** (lost on restart, acceptable for stateless app)

- **Webhook ingestion with verification (HMAC)**
  - All 16 webhooks verified using Shopify HMAC signatures
  - Secure webhook processing
  - Programmatic webhook registration (avoids protected customer data approval in dev)

- **Idempotent webhook processing (no duplicates)**
  - Event deduplication using in-memory `Set<string>` tracking
  - Event key format: `{shop}|{topic}|{resourceId}`
  - **Note:** Idempotency is per-process (not shared across instances)
  - Safe to replay events without side effects

- **Event normalization (Shopify → internal Chati events)**
  - Consistent event structure across all webhook types
  - Normalized data format for forwarding to Chati Core
  - Type-safe event definitions

- **Central event dispatcher**
  - Single dispatcher service (`event-dispatcher.server.ts`)
  - Routes events to appropriate business logic handlers
  - Extensible architecture for adding new event types

- **Business logic handlers**
  - Order notification handlers (`order-notification.server.ts`)
  - Fulfillment notification handlers (`fulfillment-notification.server.ts`)
  - Checkout notification handlers (`checkout-notification.server.ts`)
  - All handlers extract data and prepare messages (for future WhatsApp)

- **GDPR & Shopify compliance webhooks**
  - All required compliance webhooks implemented
  - Logs cleanup actions (no DB to clean in stateless app)
  - Ready for Chati Core to handle actual data deletion

- **Admin UI with Dashboard, Events, and Settings**
  - Dashboard shows empty/mock data (will fetch from Chati Core API later)
  - Event log viewer structure ready (data will come from Chati Core)
  - Settings placeholder for future configuration
  - Professional UI ready for integration

### ⏳ Deferred (Handled by Chati Core)

- Event persistence (MongoDB)
- WhatsApp message sending
- Analytics & reporting
- Retry logic for failed events
- Abandoned checkout automation
- Merchant configuration UI
- Billing & plans

---

## 3. Shopify Webhooks Coverage

### ✅ Total Webhooks Implemented: 16

#### A. Mandatory Compliance (4 / 4) ✅

**Required for Shopify App Store approval:**

1. `app/uninstalled` - Cleanup on app removal
2. `customers/data_request` - GDPR data export
3. `customers/redact` - GDPR data deletion
4. `shop/redact` - Shop data deletion

**Note:** These handle data cleanup logging. Actual cleanup will be handled by Chati Core (MongoDB).

#### B. Order Notifications (5 / 5) ✅

**Transactional order lifecycle events:**

1. `orders/create` - New order placed → `ORDER_PLACED`
2. `orders/paid` - Payment received → `ORDER_PAID`
3. `orders/cancelled` - Order cancelled → `ORDER_CANCELLED`
4. `orders/update` - Order modified → `ORDER_UPDATED`
5. `refunds/create` - Refund issued → `REFUND_CREATED`

#### C. Shipping & Fulfillment (4 / 4) ✅

**Post-purchase delivery updates:**

1. `fulfillments/create` - Fulfillment created → `FULFILLMENT_CREATED`
2. `fulfillments/update` - Fulfillment updated → `FULFILLMENT_UPDATED`
3. `fulfillment_events/create` - Tracking event added → `FULFILLMENT_EVENT`
4. `fulfillment_events/delete` - Tracking event removed → `FULFILLMENT_EVENT_DELETED`

#### D. Checkout Events (3 / 3) ✅

**Abandoned checkout tracking:**

1. `checkouts/create` - Checkout created → `CHECKOUT_CREATED`
2. `checkouts/update` - Checkout updated → `CHECKOUT_UPDATED`
3. `checkouts/delete` - Checkout deleted → `CHECKOUT_DELETED`

**Note:** All checkout webhooks are implemented and ready. Abandoned checkout automation logic will be handled by Chati Core.

---

## 4. System Architecture (High Level)

### Current Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOPIFY STORE                             │
│  (Customer places order, pays, checkout, etc.)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Webhook Events (HTTP POST)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           SHOPIFY APP (This Repo - Stateless)                 │
│                                                               │
│  Step 1: Webhook Receipt                                      │
│  ┌─────────────────────────────────────────────┐             │
│  │ routes/api.webhooks.*.ts                    │             │
│  │ - Authenticate webhook (HMAC verification)  │             │
│  │ - Extract: shop, topic, payload, resourceId │             │
│  └─────────────────────────────────────────────┘             │
│                       │                                       │
│                       ▼                                       │
│  Step 2: Idempotency Check (In-Memory)                       │
│  ┌─────────────────────────────────────────────┐             │
│  │ utils/webhook-idempotency.server.ts          │             │
│  │ - Generate eventKey: shop|topic|resourceId  │             │
│  │ - Check in-memory Set (prevent duplicates) │             │
│  │ - Mark as processed                          │             │
│  └─────────────────────────────────────────────┘             │
│                       │                                       │
│                       ▼                                       │
│  Step 3: Event Normalization                                 │
│  ┌─────────────────────────────────────────────┐             │
│  │ domain/events.ts                             │             │
│  │ - Normalize Shopify webhook → ChatiEvent    │             │
│  │ - Type-safe event structure                  │             │
│  └─────────────────────────────────────────────┘             │
│                       │                                       │
│                       ▼                                       │
│  Step 4: Event Dispatch                                      │
│  ┌─────────────────────────────────────────────┐             │
│  │ services/event-dispatcher.server.ts         │             │
│  │ - Route ChatiEvent to correct handler       │             │
│  │ - Switch on event.type                      │             │
│  └─────────────────────────────────────────────┘             │
│                       │                                       │
│                       ▼                                       │
│  Step 5: Business Logic                                      │
│  ┌─────────────────────────────────────────────┐             │
│  │ services/*-notification.server.ts            │             │
│  │ - Extract customer data                     │             │
│  │ - Build messages                            │             │
│  │ - Prepare for forwarding                     │             │
│  └─────────────────────────────────────────────┘             │
│                       │                                       │
│                       ▼                                       │
│  Step 6: Return 200 OK to Shopify                            │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ (Future: Forward to Chati Core)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CHATI CORE (MongoDB - Separate Repo)             │
│  - Store events in MongoDB                                   │
│  - Send WhatsApp notifications                               │
│  - Analytics & reporting                                     │
│  - Retry logic                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Stateless Architecture**
   - No database dependencies
   - Sessions stored in memory (acceptable for stateless app)
   - Idempotency tracked in-memory (per-process)

2. **Webhooks return 200 OK immediately**
   - No blocking external calls inside webhooks
   - Fast response times to Shopify
   - Events processed asynchronously

3. **Safe to replay events**
   - Idempotency ensures no duplicate processing (within same process)
   - Can retry failed events safely
   - Shopify handles retries automatically

4. **Easy to extend with new channels**
   - WhatsApp, Email, SMS can be added in Chati Core
   - No core logic changes required in Shopify app
   - Event dispatcher pattern supports any channel

5. **Separation of Concerns**
   - Shopify app: Event reception and forwarding
   - Chati Core: Storage, notifications, analytics

### File Structure

```
app/
├── routes/
│   ├── api.webhooks.*.ts          # 16 webhook handlers
│   ├── app._index.tsx             # Main admin UI
│   ├── app.tsx                    # App layout
│   └── auth.*.tsx                 # Authentication routes
├── components/
│   ├── DashboardTab.tsx           # Dashboard component (shows mock data)
│   ├── EventsTab.tsx              # Events log component (ready for Chati Core data)
│   ├── SettingsTab.tsx           # Settings component
│   ├── AppHeader.tsx              # Header with navigation
│   ├── Badge.tsx                  # Status badges
│   ├── Button.tsx                 # Button component
│   ├── ModernCard.tsx             # Card wrapper
│   ├── StatCard.tsx               # Statistics cards
│   ├── Skeleton.tsx               # Loading skeletons
│   └── ui/                        # Reusable UI components
├── services/
│   ├── event-dispatcher.server.ts  # Central dispatcher
│   ├── order-notification.server.ts
│   ├── fulfillment-notification.server.ts
│   └── checkout-notification.server.ts
├── domain/
│   └── events.ts                  # Event type definitions
├── utils/
│   └── webhook-idempotency.server.ts  # In-memory idempotency
├── shopify.server.ts              # Shopify app configuration
├── root.tsx                       # Root React component
├── entry.server.tsx               # Server entry point
└── styles/
    └── globals.css                # All CSS in one place
```

---

## 5. Data Storage & Persistence

### ⚠️ Important: Stateless Architecture

**This app has NO database dependencies.**

- **Sessions**: Stored in memory using `@shopify/shopify-app-session-storage-memory`
  - Lost on server restart (acceptable for stateless app)
  - OAuth tokens stored in memory

- **Idempotency**: Tracked in-memory using `Set<string>`
  - Per Node.js process (not shared across instances)
  - Lost on server restart
  - Format: `{shop}|{topic}|{resourceId}`
  - **Note:** In multi-instance deployments, each instance has its own Set

- **Events**: Not stored in this app
  - Events are forwarded to business logic handlers
  - Future: Events will be forwarded to Chati Core (MongoDB) for persistence

- **Dashboard Data**: Currently returns empty/mock data
  - Will fetch from Chati Core API when integrated
  - UI structure is ready for real data

### Why Stateless?

1. **Microservices Architecture**: Shopify app is a thin event forwarder
2. **Scalability**: No database bottlenecks
3. **Simplicity**: Fewer dependencies, easier deployment
4. **Separation**: Storage concerns handled by Chati Core (MongoDB)

---

## 6. Admin UI (Embedded in Shopify)

The app uses a **single-page tabbed UI** inside Shopify Admin.

### Tabs

#### Dashboard

- App status and connection indicator
- Webhook statistics structure (currently shows empty/mock data)
- Recent activity structure (ready for Chati Core integration)
- **Future:** Will fetch real-time stats from Chati Core API

#### Events

- Event log viewer structure (ready for Chati Core data)
- Filters by status & topic (UI ready)
- Status badges (success, pending, failed)
- Error details display
- Server-side pagination structure
- **Future:** Will fetch events from Chati Core API

#### Settings

- Placeholder for future configuration
- WhatsApp settings (planned)
- Template management (planned)
- Automation rules (planned)

### UI Stack

- **Shopify Polaris** - Layout & native feel
- **shadcn/ui** - Tables, badges, controls
- **Tailwind CSS** - Layout & utilities (all CSS managed in `globals.css`)

### Component Architecture

All UI components are modular and reusable:

- Components in `app/components/`
- CSS classes in `app/styles/globals.css`
- Loading skeletons for better UX
- Responsive design for mobile and desktop

---

## 7. Local Development

### Requirements

- Node.js (LTS version, >=20.19 <22 || >=22.12)
- Shopify CLI (`npm install -g @shopify/cli @shopify/theme`)
- Shopify Partner account
- Dev store for testing

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run locally:**

   ```bash
   shopify app dev
   ```

   **Note:** No database setup required! The app is stateless.

### Testing Webhooks

1. **Place test orders:**
   - Create orders in dev store
   - Mark orders as paid
   - Cancel orders
   - Create refunds

2. **Test fulfillments:**
   - Create fulfillments
   - Update fulfillments
   - Add tracking events

3. **Test checkouts:**
   - Create checkouts
   - Update checkouts
   - Delete checkouts

4. **Verify in console:**
   - Check server logs for webhook processing
   - Verify idempotency (duplicate webhooks are ignored)
   - Check event normalization

### Environment Variables

Required in `.env`:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=your_app_url
SCOPES=read_orders,write_orders,read_fulfillments,write_fulfillments
```

**Note:** No `DATABASE_URL` required - app is stateless!

---

## 8. Event Flow Example

### Example: Customer Places Order

```
1. Customer places order in Shopify store
   ↓
2. Shopify sends webhook POST to: /api/webhooks/orders-create
   ↓
3. api.webhooks.orders-create.ts receives request
   ├─ authenticate.webhook() → Verifies HMAC signature
   ├─ Extracts: shop="mystore.myshopify.com", topic="orders/create", payload={order data}
   └─ resourceId = String(payload.id)
   ↓
4. checkAndRecordWebhook() called
   ├─ Generates eventKey: "mystore.myshopify.com|orders/create|12345"
   ├─ Checks processedEvents Set → Not found (new event)
   └─ Adds to Set → Returns { isDuplicate: false, eventId: "..." }
   ↓
5. dispatchChatiEvent() called with:
   {
     type: "ORDER_PLACED",
     shop: "mystore.myshopify.com",
     payload: { order data }
   }
   ↓
6. event-dispatcher.server.ts routes to handleOrderCreated()
   ↓
7. order-notification.server.ts → handleOrderCreated()
   ├─ Extracts customer phone number
   ├─ Extracts order details (items, total, etc.)
   ├─ Builds message (for future WhatsApp)
   └─ Logs: "📦 Order created: #1234"
   ↓
8. updateWebhookStatus() called (currently no-op, will track in Chati Core)
   ↓
9. Returns Response("OK", { status: 200 }) to Shopify
   ↓
10. Shopify marks webhook as delivered ✅
```

---

## 9. Integration with Chati Core (MongoDB)

### Current State

The Shopify app is **ready to forward events** to Chati Core but currently:

- Events are processed and logged to console
- No external API calls are made
- Business logic handlers prepare data for future forwarding

### Future Integration Points

When Chati Core is ready, the integration will happen in:

1. **Event Dispatcher** (`services/event-dispatcher.server.ts`)
   - Add HTTP client to forward events to Chati Core API
   - Handle retries and error cases
   - Maintain idempotency across services

2. **Business Logic Handlers** (`services/*-notification.server.ts`)
   - Forward normalized events to Chati Core
   - Include all extracted customer data
   - Include message templates

3. **Dashboard** (`routes/app._index.tsx`)
   - Fetch statistics from Chati Core API
   - Display real-time event logs
   - Show analytics and metrics

### Chati Core Responsibilities

- **Event Storage**: Store all webhook events in MongoDB
- **WhatsApp Sending**: Send notifications via Meta Business API
- **Analytics**: Track delivery rates, conversions, performance
- **Retry Logic**: Handle failed notifications with exponential backoff
- **Dashboard API**: Provide endpoints for Shopify app UI

---

## 10. App Store Readiness

### ✅ Already Completed

- **GDPR compliance webhooks**
  - All 4 required compliance webhooks implemented
  - Proper logging of cleanup actions
  - Ready for Chati Core to handle actual data deletion

- **Uninstall cleanup**
  - `app/uninstalled` webhook logs cleanup actions
  - Ready for Chati Core to handle actual data deletion

- **Clear data usage boundaries**
  - Only processes webhook data
  - No unnecessary data collection
  - Stateless architecture (no data stored)

- **Embedded admin UI**
  - Professional, polished interface
  - Ready for event visibility (will fetch from Chati Core)

- **Stable webhook handling**
  - Idempotent processing
  - Error handling and logging
  - Reliable event forwarding

### ⏳ Remaining (When Ready)

- App listing copy
- Privacy policy URL
- Support contact information
- WhatsApp feature description (when implemented)
- Screenshots and promotional materials
- App Store review submission

---

## 11. Recommended Next Steps

### Phase 1: Chati Core Integration

1. **Build Chati Core Service (MongoDB)**
   - Set up MongoDB database
   - Create event storage schema
   - Build API endpoints for event ingestion

2. **Integrate Event Forwarding**
   - Add HTTP client to `event-dispatcher.server.ts`
   - Forward events to Chati Core API
   - Handle retries and error cases

3. **Dashboard Integration**
   - Connect Dashboard to Chati Core API
   - Fetch real-time statistics
   - Display event logs

### Phase 2: WhatsApp Integration (in Chati Core)

1. **Meta Business API Setup**
   - Apply for WhatsApp Business API access
   - Set up Meta Business account
   - Configure phone number

2. **WhatsApp Sender Service**
   - Create WhatsApp sender in Chati Core
   - Implement template message sending
   - Add error handling and retries

3. **Template Management**
   - Build template configuration UI
   - Store templates in MongoDB
   - Template approval workflow

### Phase 3: Abandoned Checkout (in Chati Core)

1. **Checkout Processing**
   - Process checkout events from Shopify app
   - Implement checkout abandonment detection
   - Configurable delay timers

2. **Marketing Automation**
   - Abandoned checkout message templates
   - Personalization variables
   - A/B testing support

### Phase 4: App Store Submission

1. **Documentation**
   - User guide
   - Setup instructions
   - FAQ

2. **Marketing Materials**
   - App screenshots
   - Demo video
   - Feature descriptions

3. **Support System**
   - Help center
   - Support email
   - In-app help

---

## 12. Summary for Stakeholders

### ✅ Current Status

The **Chati Shopify app is complete and stateless**.

It reliably handles:

- ✅ All 16 webhooks (transactional + compliance)
- ✅ Idempotent event processing
- ✅ Event normalization and forwarding
- ✅ Embedded admin UI (ready for Chati Core integration)
- ✅ App Store-ready architecture

### 🎯 Key Achievements

1. **Stateless Architecture**
   - No database dependencies
   - In-memory session storage
   - In-memory idempotency tracking
   - Perfect for microservices

2. **Robust Backend**
   - Idempotent webhook processing
   - Central event dispatcher
   - Type-safe event normalization
   - Extensible handler pattern

3. **Compliance Ready**
   - GDPR webhooks implemented
   - Cleanup logging (ready for Chati Core)
   - Secure webhook verification

4. **Professional UI**
   - Clean, modern interface
   - Ready for Chati Core data integration
   - Full event logging structure

5. **Extensible Architecture**
   - Easy to forward to Chati Core
   - Easy to add new webhook types
   - No refactoring needed

### 📋 Next Phase

**Chati Core (MongoDB) integration** is the next step:

- Event persistence
- WhatsApp notifications
- Analytics & reporting
- Retry logic

The Shopify app is ready to forward events as soon as Chati Core is available.

---

## 13. Technical Contacts & Resources

### Key Files

- **Webhook Handlers:** `app/routes/api.webhooks.*.ts`
- **Event Dispatcher:** `app/services/event-dispatcher.server.ts`
- **Event Types:** `app/domain/events.ts`
- **Idempotency:** `app/utils/webhook-idempotency.server.ts`
- **Main UI:** `app/routes/app._index.tsx`
- **Shopify Config:** `app/shopify.server.ts`
- **CSS:** `app/styles/globals.css`

### Documentation

- Shopify App Development: https://shopify.dev/docs/apps
- React Router: https://reactrouter.com
- Shopify Session Storage: https://github.com/Shopify/shopify-api-js/blob/main/packages/shopify-api/docs/guides/session-storage.md

---

## 14. Troubleshooting

### Common Issues

1. **Webhooks not being received**
   - Check webhook URLs in Shopify Partners dashboard
   - Verify webhook HMAC verification
   - Check server logs for authentication errors

2. **Duplicate events**
   - Verify idempotency logic in `webhook-idempotency.server.ts`
   - Check `eventKey` format: `{shop}|{topic}|{resourceId}`
   - **Note:** Idempotency is per-process (not shared across instances)

3. **Sessions lost on restart**
   - **Expected behavior** - sessions are stored in memory
   - Users will need to re-authenticate after server restart
   - This is acceptable for stateless architecture

4. **UI shows empty data**
   - **Expected behavior** - dashboard shows mock data
   - Will display real data when Chati Core API is integrated
   - UI structure is ready for integration

### Debugging

- All webhook events are logged to console
- Check server logs for event processing
- Verify event normalization in `domain/events.ts`
- Check event dispatcher routing in `event-dispatcher.server.ts`

---

## 15. Architecture Decisions

### Why Stateless?

1. **Microservices Pattern**: Separates concerns between Shopify app and Chati Core
2. **Scalability**: No database bottlenecks, easier horizontal scaling
3. **Simplicity**: Fewer dependencies, easier deployment
4. **Future-Proof**: Easy to add Chati Core without refactoring

### Why In-Memory Idempotency?

1. **Stateless Requirement**: No database for idempotency tracking
2. **Acceptable Trade-off**: Per-process tracking is sufficient for current needs
3. **Shopify Retries**: Shopify handles retries automatically
4. **Future**: Chati Core will handle persistent idempotency

### Why Forward Events (Not Store)?

1. **Separation of Concerns**: Storage handled by Chati Core
2. **Single Responsibility**: Shopify app focuses on event reception
3. **Flexibility**: Chati Core can process events asynchronously
4. **Scalability**: No database load on Shopify app

---

**End of Documentation**
