import type { Preview } from "@storybook/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n/config";
import React from "react";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "en-US",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en-US", title: "English" },
          { value: "es-ES", title: "Español" },
          { value: "fr-FR", title: "Français" },
          { value: "de-DE", title: "Deutsch" },
          { value: "ja-JP", title: "日本語" },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
