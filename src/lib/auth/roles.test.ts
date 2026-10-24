import { describe, expect, it } from "vitest";
import { homePathForRole, roleLabel, userStatusLabel } from "./roles";

describe("role helpers", () => {
  it("sends mentees and mentors to the dashboard", () => {
    expect(homePathForRole("mentee")).toBe("/dashboard");
    expect(homePathForRole("mentor")).toBe("/dashboard");
  });

  it("sends admins to the admin panel", () => {
    expect(homePathForRole("admin")).toBe("/admin");
  });

  it("translates roles and statuses for the UI", () => {
    expect(roleLabel("mentor")).toBe("Mentora");
    expect(roleLabel("mentee")).toBe("Mentorada");
    expect(userStatusLabel("active")).toBe("Activa");
  });
});
