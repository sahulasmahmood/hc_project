const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    // console.log('Fetching all appointments...');
    const appointments = await prisma.appointment.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    // console.log('Found appointments:', appointments);
    res.json(appointments);
  } catch (error) {
    // console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get single appointment
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Fetching appointment with ID:', id);
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });
    // console.log('Found appointment:', appointment);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    // console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patientId, // <-- new
      patientPhone,
      date,
      time,
      type,
      duration,
      notes = '',
      status = 'Pending'
    } = req.body;

    let patient = null;
    if (patientId) {
      // Try to find patient by ID
      patient = await prisma.patient.findUnique({
        where: { id: typeof patientId === 'string' ? parseInt(patientId) : patientId }
      });
    }
    if (!patient) {
      // Fallback: find by phone
      patient = await prisma.patient.findFirst({
        where: { phone: patientPhone }
      });
    }

    if (!patient) {
      return res.status(400).json({ error: "Patient not found. Please create the patient record first." });
    }

    // Validate: Prevent scheduling in the past (allow if slot's END time is in the future)
    // Fix timezone issue by creating date in local timezone
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
    // Parse time string (e.g., '10:30 AM') to set hours and minutes
    let slotDurationMinutes = 30; // default fallback
    if (duration) {
      slotDurationMinutes = parseInt(duration);
      if (isNaN(slotDurationMinutes)) slotDurationMinutes = 30;
    }
    if (time) {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      appointmentDate.setHours(hours, minutes, 0, 0);
    }
    const slotEnd = new Date(appointmentDate.getTime() + slotDurationMinutes * 60000);
    if (slotEnd < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule an appointment in the past.' });
    }

    try {
      const appointment = await prisma.appointment.create({
        data: {
          patientName: patient.name,
          patientPhone,
          patientVisibleId: patient.visibleId,
          date: appointmentDate,
          time,
          type,
          duration,
          notes: notes || null,
          status,
          patientId: patient.id
        }
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error(error); // Log the error for debugging
      // Handle unique constraint violation (duplicate booking)
      if (error.code === 'P2002' && error.meta && error.meta.target && error.meta.target.includes('date_time')) {
        return res.status(409).json({ error: 'This time slot is already booked. Please select a different time.' });
      }
      // Fallback for other errors
      return res.status(500).json({ error: 'Failed to create appointment' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      patientPhone,
      date,
      time,
      type,
      duration,
      notes,
      status
    } = req.body;

    console.log('Updating appointment:', id, 'with data:', req.body);

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        patientName,
        patientPhone,
        date: date ? (() => {
          // Fix timezone issue by creating date in local timezone
          const [year, month, day] = date.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        })() : undefined,
        time,
        type,
        duration,
        notes: notes || null,
        status
      }
    });

    // console.log('Updated appointment:', appointment);
    res.json(appointment);
  } catch (error) {
    // console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Deleting appointment:', id);
    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    });
    // console.log('Appointment deleted successfully');
    res.status(204).send();
  } catch (error) {
    // console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime } = req.body;

    console.log('Rescheduling appointment:', id, 'to', newDate, newTime);

    // Get the current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if appointment can be rescheduled
    const blockedStatuses = ["In Progress", "Completed", "Cancelled"];
    if (blockedStatuses.includes(currentAppointment.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule appointment with status "${currentAppointment.status}". Only pending or confirmed appointments can be rescheduled.` 
      });
    }

    // Validate new date and time
    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'New date and time are required' });
    }

    // Parse the new appointment date and time
    // Fix timezone issue by creating date in local timezone
    const [year, month, day] = newDate.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
    const [timePart, period] = newTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Validate: Prevent scheduling in the past
    const slotDurationMinutes = parseInt(currentAppointment.duration) || 30;
    const slotEnd = new Date(appointmentDate.getTime() + slotDurationMinutes * 60000);
    if (slotEnd < new Date()) {
      return res.status(400).json({ error: 'Cannot reschedule to a time in the past.' });
    }

    // Check if the new time slot is available (excluding the current appointment)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate, // Use the already created timezone-safe date
        time: newTime,
        id: { not: parseInt(id) } // Exclude the current appointment
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ 
        error: `Time slot ${newTime} on ${newDate} is already booked by ${conflictingAppointment.patientName}. Please select a different time.` 
      });
    }

    // Update the appointment with new date and time
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        date: appointmentDate,
        time: newTime
      }
    });

    console.log('Appointment rescheduled successfully:', updatedAppointment);
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
};

const swapAppointments = async (req, res) => {
  const { id1, id2 } = req.body;
  if (!id1 || !id2) {
    return res.status(400).json({ error: "Both appointment IDs are required" });
  }
  try {
    const [a1, a2] = await Promise.all([
      prisma.appointment.findUnique({ where: { id: id1 } }),
      prisma.appointment.findUnique({ where: { id: id2 } }),
    ]);
    if (!a1 || !a2) {
      return res.status(404).json({ error: "One or both appointments not found" });
    }
    const blocked = ["In Progress", "Completed", "Cancelled"];
    if (blocked.includes(a1.status) || blocked.includes(a2.status)) {
      return res.status(400).json({ error: "Cannot swap appointments with current status" });
    }

    // Use a temporary time value that cannot conflict
    const tempTime = "__TEMP__" + Date.now();

    await prisma.$transaction([
      // Step 1: Move A to a temporary slot
      prisma.appointment.update({
        where: { id: id1 },
        data: { date: a1.date, time: tempTime }
      }),
      // Step 2: Move B to A's original slot
      prisma.appointment.update({
        where: { id: id2 },
        data: { date: a1.date, time: a1.time }
      }),
      // Step 3: Move A to B's original slot
      prisma.appointment.update({
        where: { id: id1 },
        data: { date: a2.date, time: a2.time }
      }),
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error swapping appointments:", error);
    res.status(500).json({ error: "Failed to swap appointments" });
  }
};

module.exports = {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  swapAppointments
};