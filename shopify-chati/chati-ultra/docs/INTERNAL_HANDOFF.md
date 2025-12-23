# Chati Shopify App - Internal Documentation & Handoff

**Project Status:** Foundation Complete (WhatsApp integration intentionally paused)  
**Last Updated:** 2024  
**Version:** 1.0.0

---

## 1. Project Overview

Chati is a Shopify public embedded app designed to power transactional customer notifications (and later marketing automation) using Shopify webhooks.

At this stage, the project focuses on:

- ✅ A robust Shopify backend
- ✅ Legal & App Store compliance
- ✅ Reliable event processing
- ✅ A clean embedded Admin UI for visibility and debugging

**Important:** WhatsApp integration is intentionally deferred per company direction and can be added later without refactoring.

---

## 2. What the App Does (Current Scope)

### ✅ Implemented

- **Shopify OAuth & embedded admin app**
  - Full authentication flow
  - Embedded app experience in Shopify Admin
  - Session management with Prisma

- **Webhook ingestion with verification (HMAC)**
  - All webhooks verified using Shopify HMAC signatures
  - Secure webhook processing

- **Idempotent webhook processing (no duplicates)**
  - Event deduplication using `eventKey` (shop + topic + resourceId)
  - Safe to replay events without side effects

- **Event normalization (Shopify → internal Chati events)**
  - Consistent event structure across all webhook types
  - Normalized data format for future processing

- **Central event dispatcher**
  - Single dispatcher service (`event-dispatcher.server.ts`)
  - Extensible architecture for adding new channels

- **Prisma-backed persistence**
  - All webhook events stored in database
  - Full audit trail for debugging and analytics

- **GDPR & Shopify compliance webhooks**
  - All required compliance webhooks implemented
  - Data cleanup on uninstall

- **Admin UI with Dashboard, Events, and Settings**
  - Real-time webhook statistics
  - Event log viewer with filters
  - Pagination and search capabilities
  - Settings placeholder for future configuration

### ⏳ Deferred (Planned)

- WhatsApp message sending
- Abandoned checkout automation
- Merchant configuration UI
- Billing & plans
- Marketing automation templates

---

## 3. Shopify Webhooks Coverage

### ✅ Total Webhooks Implemented: 13

#### A. Mandatory Compliance (4 / 4) ✅

**Required for Shopify App Store approval:**

1. `app/uninstalled` - Cleanup on app removal
2. `customers/data_request` - GDPR data export
3. `customers/redact` - GDPR data deletion
4. `shop/redact` - Shop data deletion

**Note:** These handle data cleanup and GDPR requirements. No messages are sent for these events.

#### B. Order Notifications (5 / 5) ✅

**Transactional order lifecycle events:**

1. `orders/create` - New order placed
2. `orders/paid` - Payment received
3. `orders/cancelled` - Order cancelled
4. `orders/updated` - Order modified
5. `refunds/create` - Refund issued

#### C. Shipping & Fulfillment (4 / 4) ✅

**Post-purchase delivery updates:**

1. `fulfillments/create` - Fulfillment created
2. `fulfillments/update` - Fulfillment updated
3. `fulfillment_events/create` - Tracking event added
4. `fulfillment_events/delete` - Tracking event removed

#### D. Abandoned Checkout (0 / 3) ⏳

**Intentionally not implemented yet:**

- `checkouts/create`
- `checkouts/update`
- `checkouts/delete`

**Reason:** Requires timers, consent rules, and marketing templates. Planned for future release.

---

## 4. System Architecture (High Level)

```
Shopify Webhook
   ↓
HMAC Verification
   ↓
Idempotency Check (DB)
   ↓
Event Normalization (Shopify → Chati)
   ↓
Central Dispatcher
   ↓
Service Layer
   ↓
(Currently: Logs / UI)
   ↓
(Future: WhatsApp Sender)
```

### Key Design Principles

1. **Webhooks return 200 OK immediately**
   - No blocking external calls inside webhooks
   - Fast response times to Shopify

2. **No blocking external calls inside webhooks**
   - All external communication happens asynchronously
   - Prevents webhook timeouts

3. **Safe to replay events**
   - Idempotency ensures no duplicate processing
   - Can retry failed events safely

4. **Easy to extend with new channels**
   - WhatsApp, Email, SMS can be added as new services
   - No core logic changes required

### File Structure

```
app/
├── routes/
│   ├── api.webhooks.*.ts          # Webhook handlers
│   └── app._index.tsx             # Main admin UI
├── components/
│   ├── DashboardTab.tsx           # Dashboard component
│   ├── EventsTab.tsx              # Events log component
│   ├── SettingsTab.tsx             # Settings component
│   ├── AppHeader.tsx               # Header with navigation
│   ├── Badge.tsx                   # Status badges
│   ├── Button.tsx                  # Button component
│   ├── ModernCard.tsx              # Card wrapper
│   ├── StatCard.tsx                # Statistics cards
│   └── Skeleton.tsx                # Loading skeletons
├── services/
│   ├── event-dispatcher.server.ts  # Central dispatcher
│   ├── order-notification.server.ts
│   └── fulfillment-notification.server.ts
├── utils/
│   ├── webhook-idempotency.server.ts
│   └── webhook-queries.server.ts
└── styles/
    └── globals.css                 # All CSS in one place
```

---

## 5. Database Models (Key)

### WebhookEvent

Stores every webhook processed:

```prisma
model WebhookEvent {
  id          Int      @id @default(autoincrement())
  eventKey    String   @unique  // shop + topic + resourceId (idempotency)
  shop        String
  topic       String
  resourceId  String
  status      String   // pending / success / failed
  error       String?
  processedAt DateTime?
  createdAt   DateTime @default(now())
}
```

**Used for:**

- Debugging webhook issues
- Admin UI visibility
- Future retries & analytics
- Idempotency checks

### Session

Shopify session management (handled by `@shopify/shopify-app-session-storage-prisma`)

---

## 6. Admin UI (Embedded in Shopify)

The app uses a **single-page tabbed UI** inside Shopify Admin.

### Tabs

#### Dashboard
- App status and connection indicator
- Webhook statistics (Total Events, Processing, Success Rate, Failed Events)
- Recent activity live stream
- Real-time webhook activity table

#### Events
- Paginated webhook logs
- Filters by status & topic
- Status badges (success, pending, failed)
- Error details display
- Server-side pagination

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

- Node.js (LTS version)
- Shopify CLI (`npm install -g @shopify/cli @shopify/theme`)
- Shopify Partner account
- Dev store for testing

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   npx prisma migrate dev
   ```

3. **Run locally:**
   ```bash
   shopify app dev
   ```

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

3. **Verify in UI:**
   - Check Dashboard for stats
   - View Events tab for logs
   - Test filters and pagination

### Environment Variables

Required in `.env`:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
DATABASE_URL=your_database_url
```

---

## 8. Why WhatsApp Is Not Implemented Yet

**This is a deliberate decision, not a limitation.**

### Reasons

1. **Company priority** - Focus on finishing the base project first
2. **WhatsApp requirements:**
   - Meta Business API approval
   - Template setup and approval
   - Compliance checks
   - Phone number verification

### Current Architecture Support

The architecture **already supports WhatsApp** as a drop-in sender:

```typescript
// Current (in event-dispatcher.server.ts)
console.log(`[${event.topic}] Message: ${message}`);

// Future (when WhatsApp is added)
await sendWhatsApp(shop, customerPhone, message);
```

**When enabled, the change is limited to:**

- Adding a WhatsApp sender service
- Replacing `console.log(message)` with `sendWhatsApp()`
- **No core logic changes required**

The dispatcher pattern makes it trivial to add new channels.

---

## 9. App Store Readiness

### ✅ Already Completed

- **GDPR compliance webhooks**
  - All 4 required compliance webhooks implemented
  - Proper data handling and cleanup

- **Uninstall cleanup**
  - `app/uninstalled` webhook removes all shop data
  - Clean uninstall process

- **Clear data usage boundaries**
  - Only processes webhook data
  - No unnecessary data collection

- **Embedded admin UI**
  - Professional, polished interface
  - Full event visibility for merchants

- **Stable webhook handling**
  - Idempotent processing
  - Error handling and logging
  - Reliable event storage

### ⏳ Remaining (When Ready)

- App listing copy
- Privacy policy URL
- Support contact information
- WhatsApp feature description (when implemented)
- Screenshots and promotional materials
- App Store review submission

---

## 10. Recommended Next Steps (When Approved)

### Phase 1: WhatsApp Integration

1. **Meta Business API Setup**
   - Apply for WhatsApp Business API access
   - Set up Meta Business account
   - Configure phone number

2. **WhatsApp Sender Service**
   - Create `whatsapp-sender.server.ts`
   - Implement template message sending
   - Add error handling and retries

3. **Template Management**
   - Build template configuration UI
   - Store templates in database
   - Template approval workflow

### Phase 2: Abandoned Checkout

1. **Checkout Webhooks**
   - Implement `checkouts/create`, `checkouts/update`, `checkouts/delete`
   - Add checkout tracking to database

2. **Timer System**
   - Implement checkout abandonment detection
   - Configurable delay timers
   - Consent checking

3. **Marketing Templates**
   - Abandoned checkout message templates
   - Personalization variables
   - A/B testing support

### Phase 3: Merchant Configuration

1. **Settings UI**
   - WhatsApp configuration
   - Template editor
   - Automation rules builder
   - Notification preferences

2. **Analytics Dashboard**
   - Message delivery rates
   - Conversion tracking
   - Performance metrics

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

## 11. Summary for Stakeholders

### ✅ Current Status

The **Chati Shopify app foundation is complete**.

It reliably handles:
- ✅ All required transactional webhooks (13 total)
- ✅ All compliance webhooks (GDPR, uninstall)
- ✅ Embedded admin UI with full event visibility
- ✅ App Store-ready architecture

### 🎯 Key Achievements

1. **Robust Backend**
   - Idempotent webhook processing
   - Central event dispatcher
   - Full audit trail

2. **Compliance Ready**
   - GDPR webhooks implemented
   - Data cleanup on uninstall
   - Secure webhook verification

3. **Professional UI**
   - Clean, modern interface
   - Real-time statistics
   - Full event logging

4. **Extensible Architecture**
   - Easy to add WhatsApp
   - Easy to add new channels
   - No refactoring needed

### 📋 Next Phase

**WhatsApp integration and marketing automation are intentionally paused** and can be added without refactoring.

The architecture is designed to support these features when ready.

---

## 12. Technical Contacts & Resources

### Key Files

- **Webhook Handlers:** `app/routes/api.webhooks.*.ts`
- **Event Dispatcher:** `app/services/event-dispatcher.server.ts`
- **Main UI:** `app/routes/app._index.tsx`
- **Database Schema:** `prisma/schema.prisma`
- **CSS:** `app/styles/globals.css`

### Documentation

- Shopify App Development: https://shopify.dev/docs/apps
- Prisma Documentation: https://www.prisma.io/docs
- React Router: https://reactrouter.com

---

## 13. Troubleshooting

### Common Issues

1. **Webhooks not appearing in UI**
   - Check database connection
   - Verify webhook URLs in Shopify Partners dashboard
   - Check webhook HMAC verification

2. **Duplicate events**
   - Verify idempotency logic in `webhook-idempotency.server.ts`
   - Check `eventKey` uniqueness

3. **UI not loading**
   - Check Polaris CSS import in `root.tsx`
   - Verify Tailwind CSS compilation
   - Check browser console for errors

### Debugging

- All webhook events are logged to database
- Check `WebhookEvent` table for event status
- Use Events tab in admin UI for real-time debugging

---

**End of Documentation**

