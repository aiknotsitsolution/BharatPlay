export const statusLabels = {
  pending: "Pending",
  under_review: "Under Review",
  more_information_required: "More Information Required",
  action_pending: "Action Pending",
  takedown_approved: "Takedown Approved",
  takedown_rejected: "Takedown Rejected",
  disputed: "Disputed",
  dispute_under_review: "Dispute Under Review",
  dispute_upheld: "Dispute Upheld",
  dispute_overturned: "Dispute Overturned",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

export const statusColors = {
  pending: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  under_review: "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  more_information_required:
    "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  action_pending: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  takedown_approved: "bg-red-500/15 text-red-400 border-red-500/30",
  takedown_rejected:
    "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  disputed: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  dispute_under_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  dispute_upheld: "bg-red-500/15 text-red-400 border-red-500/30",
  dispute_overturned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  withdrawn:
    "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
};

export const priorityBadgeColors = {
  low: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  medium: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  high: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const relationshipLabels = {
  owner: "Copyright owner",
  authorized_representative: "Authorized representative",
  agent: "Agent",
  other: "Other",
};

export const statusOptions = Object.entries(statusLabels).map(
  ([value, label]) => ({ value, label }),
);
