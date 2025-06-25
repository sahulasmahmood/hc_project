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
    const appointmentDate = new Date(date);
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
          date: new Date(date),
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
        date: date ? new Date(date) : undefined,
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

module.exports = {
  getAllAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
};