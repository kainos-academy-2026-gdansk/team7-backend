export type JobRoleWithRelations = {
  roleName: string;
  location: string;
  closingDate: Date | null;
  band: { name: string };
  capability: { name: string };
};
