import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/use-appointment-settings";
import PatientFormDialog from "@/components/patients/PatientFormDialog"; // For quick create

interface AppointmentDialogProps {
  appointment?: any;
  mode: 'create' | 'edit';
  onSave: (appointmentData: any) => Promise<any> | void;
  onClose?: () => void;
}

const AppointmentDialog = ({ appointment, mode, onSave, onClose }: AppointmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || "",
    patientPhone: appointment?.patientPhone || "",
    date: appointment?.date ? new Date(appointment.date) : new Date(),
    time: appointment?.time || "",
    duration: appointment?.duration || "30",
    type: appointment?.type || "Consultation",
    notes: appointment?.notes || ""
  });
  const { toast } = useToast();
  const [patientFound, setPatientFound] = useState<boolean | null>(null);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  // Use appointment settings hook
  const { 
    settings, 
    loading: settingsLoading, 
    getActiveTimeSlots, 
    getActiveDurations, 
    getAvailableTimeSlots,
    isWithinAdvanceBookingWindow,
    checkAppointmentConflict
  } = useAppointmentSettings();

  // Get dynamic time slots and durations
  const timeSlots = getActiveTimeSlots().map(slot => slot.time);
  const durations = getActiveDurations();
  const appointmentTypes = settings.appointmentTypes;

  // Load existing appointments for the selected date
  useEffect(() => {
    if (formData.date) {
      loadExistingAppointments();
    }
  }, [formData.date]);

  const loadExistingAppointments = async () => {
    try {
      const dateString = formData.date.toISOString().split('T')[0];
      const response = await api.get(`/appointments?date=${dateString}`);
      setExistingAppointments(response.data || []);
    } catch (error) {
      console.log("Failed to load existing appointments");
      setExistingAppointments([]);
    }
  };

  // Get available time slots for the selected date
  const getAvailableSlots = () => {
    if (!formData.date) return timeSlots;
    
    const availableSlots = getAvailableTimeSlots(formData.date, existingAppointments);
    return availableSlots.map(slot => slot.time);
  };

  // Check if selected time slot is available
  const isTimeSlotAvailable = (time: string) => {
    if (!formData.date) return true;
    
    const availableSlots = getAvailableSlots();
    return availableSlots.includes(time);
  };

  // Check if date is within booking window
  const isDateValid = (date: Date) => {
    return isWithinAdvanceBookingWindow(date);
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, patientPhone: phone });
    setSelectedPatientId(null);
    setMatchingPatients([]);

    if (phone.length >= 8) {
      try {
        const res = await api.get(`/patients/search/by-phone?phone=${phone}`);
        if (Array.isArray(res.data) && res.data.length > 1) {
          setMatchingPatients(res.data);
          setPatientFound(true);
          setShowCreatePatient(false);
          setFormData(prev => ({ ...prev, patientName: "" }));
        } else if (Array.isArray(res.data) && res.data.length === 1) {
          setMatchingPatients([]);
          setFormData(prev => ({ ...prev, patientName: res.data[0].name }));
          setSelectedPatientId(res.data[0].id);
          setPatientFound(true);
          setShowCreatePatient(false);
        } else {
          setPatientFound(false);
          setShowCreatePatient(true);
          setFormData(prev => ({ ...prev, patientName: "" }));
        }
      } catch {
        setPatientFound(false);
        setShowCreatePatient(true);
        setFormData(prev => ({ ...prev, patientName: "" }));
      }
    } else {
      setPatientFound(null);
      setShowCreatePatient(false);
      setFormData(prev => ({ ...prev, patientName: "" }));
      setMatchingPatients([]);
      setSelectedPatientId(null);
    }
  };

  const handleSave = async () => {
    // Check for appointment conflicts
    if (formData.date && formData.time && formData.duration) {
      const hasConflict = checkAppointmentConflict(
        formData.date, 
        formData.time, 
        parseInt(formData.duration), 
        existingAppointments
      );
      
      if (hasConflict) {
        toast({
          title: "Appointment Conflict",
          description: "This time slot conflicts with an existing appointment. Please choose a different time.",
          variant: "destructive"
        });
        return;
      }
    }

    // Format date as UTC midnight to avoid timezone issues
    const formattedDate = formData.date instanceof Date
      ? new Date(Date.UTC(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate()
        )).toISOString()
      : formData.date;
    const appointmentData = {
      ...formData,
      date: formattedDate,
      id: appointment?.id || Date.now(),
      status: appointment?.status || "Pending"
    };
    // Await onSave in case it's async
    const result = await onSave(appointmentData);
    // Only close if save was successful
    if (result !== false) {
      setOpen(false);
      if (onClose) onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="bg-medical-500 hover:bg-medical-600">
            <Plus className="h-4 w-4 mr-2" /> New Appointment
          </Button>
        ) : (
          <Button className="bg-medical-500 hover:bg-medical-600">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Schedule New Appointment' : 'Edit Appointment'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patientPhone">Patient Phone</Label>
            <Input
              id="patientPhone"
              value={formData.patientPhone}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              required
            />
            {patientFound === false && (
              <div className="text-red-600 text-xs mt-1 flex items-center gap-2">
                Patient not found.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            {matchingPatients.length > 1 ? (
              <Select
                value={selectedPatientId || ""}
                onValueChange={(id) => {
                  setSelectedPatientId(id);
                  const patient = matchingPatients.find(p => String(p.id) === id);
                  if (patient) setFormData(prev => ({ ...prev, patientName: patient.name }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {matchingPatients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.visibleId}) - {p.age}y / {p.gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="patientName"
                value={formData.patientName}
                readOnly
                placeholder="Autofilled from patient record"
                disabled
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date && isDateValid(date)) {
                        setFormData({...formData, date, time: ""});
                      } else if (date) {
                        toast({
                          title: "Invalid Date",
                          description: `Appointments can only be booked up to ${settings.advanceBookingDays} days in advance.`,
                          variant: "destructive"
                        });
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => !isDateValid(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select 
                value={formData.time} 
                onValueChange={(time) => setFormData({...formData, time})}
                disabled={settingsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={settingsLoading ? "Loading..." : "Select time"} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSlots().map((time) => (
                    <SelectItem 
                      key={time} 
                      value={time}
                      className={!isTimeSlotAvailable(time) ? "text-gray-400" : ""}
                    >
                      {time} {!isTimeSlotAvailable(time) && "(Unavailable)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(type) => setFormData({...formData, type})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select 
                value={formData.duration} 
                onValueChange={(duration) => setFormData({...formData, duration})}
                disabled={settingsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={settingsLoading ? "Loading..." : "Select duration"} />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or special instructions"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-medical-500 hover:bg-medical-600"
            disabled={!patientFound}
            onClick={handleSave}
          >
            {mode === 'create' ? 'Schedule' : 'Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
