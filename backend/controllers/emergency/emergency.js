const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Get all emergency cases (with patient info)
const getAllEmergencyCases = async (req, res) => {
  try {
    const cases = await prisma.emergencyCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        appointment: true,
      },
    });
    // Transform cases to match frontend format
    const transformed = cases.map((c) => ({
      id: c.id,
      caseId: `EM${c.id.toString().padStart(3, '0')}`,
      patientName: c.patient?.name || '',
      age: c.patient?.age || '',
      gender: c.patient?.gender || '',
      phone: c.patient?.phone || '',
      chiefComplaint: c.chiefComplaint,
      arrivalTime: c.arrivalTime.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      triagePriority: c.triagePriority,
      assignedTo: c.assignedTo,
      status: c.status,
      vitals: {
        bp: c.vitals?.bp || '',
        pulse: c.vitals?.pulse || '',
        temp: c.vitals?.temp || '',
        spo2: c.vitals?.spo2 || '',
      },
      // Add more fields if needed by frontend
    }));
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching emergency cases:', error);
    res.status(500).json({ error: 'Failed to fetch emergency cases' });
  }
};

// Get emergency case by ID
const getEmergencyCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await prisma.emergencyCase.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        appointment: true,
      },
    });
    if (!c) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    // Transform to match frontend format
    const transformed = {
      id: c.id,
      caseId: `EM${c.id.toString().padStart(3, '0')}`,
      patientName: c.patient?.name || '',
      age: c.patient?.age || '',
      gender: c.patient?.gender || '',
      phone: c.patient?.phone || '',
      chiefComplaint: c.chiefComplaint,
      arrivalTime: c.arrivalTime.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      triagePriority: c.triagePriority,
      assignedTo: c.assignedTo,
      status: c.status,
      vitals: {
        bp: c.vitals?.bp || '',
        pulse: c.vitals?.pulse || '',
        temp: c.vitals?.temp || '',
        spo2: c.vitals?.spo2 || '',
      },
      // Add more fields if needed by frontend
    };
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching emergency case:', error);
    res.status(500).json({ error: 'Failed to fetch emergency case' });
  }
};

// Create new emergency case
const createEmergencyCase = async (req, res) => {
  try {
    const {
      patientId,
      chiefComplaint,
      arrivalTime,
      triagePriority,
      assignedTo,
      status,
      vitals,
      appointmentId,
    } = req.body;

    // Validate required fields
    if (!patientId || !chiefComplaint || !arrivalTime || !triagePriority || !assignedTo || !status || !vitals) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure patient exists
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(patientId) } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const newCase = await prisma.emergencyCase.create({
      data: {
        patientId: parseInt(patientId),
        chiefComplaint,
        arrivalTime: new Date(arrivalTime),
        triagePriority,
        assignedTo,
        status,
        vitals,
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating emergency case:', error);
    res.status(500).json({ error: 'Failed to create emergency case' });
  }
};

// Update emergency case
const updateEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chiefComplaint,
      arrivalTime,
      triagePriority,
      assignedTo,
      status,
      vitals,
      appointmentId,
    } = req.body;

    const updatedCase = await prisma.emergencyCase.update({
      where: { id: parseInt(id) },
      data: {
        chiefComplaint,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
        triagePriority,
        assignedTo,
        status,
        vitals,
        appointmentId: appointmentId ? parseInt(appointmentId) : undefined,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });

    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to update emergency case' });
  }
};

// Delete emergency case
const deleteEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.emergencyCase.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to delete emergency case' });
  }
};

    // Transfer emergency case
const transferEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferTo, transferReason, transferNotes } = req.body;
    if (!transferTo || !transferReason) {
      return res.status(400).json({ error: 'Missing required transfer fields' });
    }
    const updatedCase = await prisma.emergencyCase.update({
      where: { id: parseInt(id) },
      data: {
        transferStatus: 'Transferred',
        transferTo,
        transferReason,
        transferNotes,
        transferTime: new Date(),
        status: 'Transferred',
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
    res.json(updatedCase);
  } catch (error) {
    console.error('Error transferring emergency case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    res.status(500).json({ error: 'Failed to transfer emergency case' });
  }
};

module.exports = {
  getAllEmergencyCases,
  getEmergencyCaseById,
  createEmergencyCase,
  updateEmergencyCase,
  deleteEmergencyCase,
  transferEmergencyCase,
};