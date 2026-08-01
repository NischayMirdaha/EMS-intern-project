import { createOrUpdateStaffProfile, findStaffByUserId, listStaff, toggleStaffStatus, updateStaffRole } from "./staffModel.js";
import { sanitizeStaff } from "./staffUtils.js";

export const listStaffMembers = async (_req, res) => {
  try {
    const staffMembers = await listStaff();
    res.status(200).json({ success: true, staff: staffMembers.map(sanitizeStaff) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load staff members.", error: error.message });
  }
};

export const createStaffMember = async (req, res) => {
  try {
    const { userId, role, department, position, phone, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    if (role) {
      await updateStaffRole({ userId, role });
    }

    await createOrUpdateStaffProfile({ userId, department, position, phone, isActive });

    const staff = await findStaffByUserId(userId);

    return res.status(201).json({ success: true, message: "Staff profile created.", staff: sanitizeStaff(staff) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create staff member.", error: error.message });
  }
};

export const updateStaffMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, department, position, phone, isActive } = req.body;

    if (role) {
      await updateStaffRole({ userId: Number(userId), role });
    }

    await createOrUpdateStaffProfile({ userId: Number(userId), department, position, phone, isActive });

    const staff = await findStaffByUserId(Number(userId));

    return res.status(200).json({ success: true, message: "Staff profile updated.", staff: sanitizeStaff(staff) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update staff member.", error: error.message });
  }
};

export const deactivateStaffMember = async (req, res) => {
  try {
    const { userId } = req.params;
    await toggleStaffStatus({ userId: Number(userId), isActive: false });
    const staff = await findStaffByUserId(Number(userId));

    return res.status(200).json({ success: true, message: "Staff member deactivated.", staff: sanitizeStaff(staff) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to deactivate staff member.", error: error.message });
  }
};
