import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Page, Card, Text, BlockStack } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Page title="Settings">
        <div className="mt-6">
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Settings
                </Text>
                <div className="mt-4">
                  <Text variant="bodyMd" as="p" color="subdued">
                    Settings page coming soon. This is a placeholder for future
                    configuration options.
                  </Text>
                </div>
              </BlockStack>
            </div>
          </Card>
        </div>
      </Page>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

