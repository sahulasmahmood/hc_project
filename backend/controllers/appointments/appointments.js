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
      patientPhone,
      date,
      time,
      type,
      duration,
      notes = '',
      status = 'Pending'
    } = req.body;

    // Find patient by phone number
    const patient = await prisma.patient.findFirst({
      where: { phone: patientPhone }
    });

    if (!patient) {
      return res.status(400).json({ error: "Patient not found. Please create the patient record first." });
    }

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

    // console.log('Created appointment:', appointment);
    res.status(201).json(appointment);
  } catch (error) {
    // console.error('Error creating appointment:', error);
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