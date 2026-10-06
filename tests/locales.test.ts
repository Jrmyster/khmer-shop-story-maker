import { it, expect } from "vitest";
import { en } from "../src/locales/en";
import { km } from "../src/locales/km";
import { translate } from "../src/locales";
it("has every interface translation with consistent arrays", () => {
  expect(Object.keys(km).sort()).toEqual(Object.keys(en).sort());
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(km[key]).toBeTruthy();
    if (Array.isArray(en[key])) expect(km[key]).toHaveLength(en[key].length);
  }
});
it("supports both scripts without losing the Khmer text", () => {
  expect(translate("both", "shop")).toContain(en.shop);
  expect(translate("both", "shop")).toContain(km.shop);
  expect(translate("both", "app")).not.toContain(" · ");
});
