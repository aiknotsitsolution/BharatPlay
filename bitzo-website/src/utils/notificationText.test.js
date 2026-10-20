import { describe, expect, it } from "vitest";
import { getNotificationText } from "./notificationText";

describe("notification text", () => {
  it.each([
    ["subscribe", "Someone subscribed to your channel"],
    ["like", 'Someone liked your video "your video"'],
    ["comment", 'Someone commented on your video "your video"'],
    ["upload", 'Someone uploaded a new video "your video"'],
    [
      "copyright_takedown_approved",
      'Your video "your video" has been removed due to a copyright takedown',
    ],
    [
      "copyright_takedown_rejected",
      'A copyright takedown request on "your video" was rejected',
    ],
    [
      "copyright_takedown_received",
      'A copyright takedown request has been filed for "your video"',
    ],
    [
      "copyright_strike_received",
      'Your video "your video" has received a copyright strike',
    ],
    [
      "copyright_dispute_filed",
      'A dispute has been filed for the copyright claim on "your video"',
    ],
    [
      "copyright_dispute_resolved",
      'Your copyright dispute for "your video" has been resolved',
    ],
    [
      "copyright_case_assigned",
      'The copyright case involving "your video" has been assigned for review',
    ],
    [
      "copyright_case_resolved",
      'A copyright case involving "your video" has been resolved',
    ],
    [
      "copyright_case_created",
      'A new copyright claim has been filed on "your video"',
    ],
    ["support_reply", "The support team replied to your request"],
    ["support_status", "Your support request status has been updated"],
    ["unknown", "You have a new notification"],
  ])("renders %s notification text in English", (type, expected) => {
    expect(getNotificationText({ type })).toBe(expected);
  });

  it("keeps actor and video titles in their original form", () => {
    expect(
      getNotificationText({
        type: "like",
        actor: { name: "Asha" },
        video: { title: "My video" },
      }),
    ).toBe('Asha liked your video "My video"');
  });
});
