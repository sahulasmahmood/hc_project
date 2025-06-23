import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/use-appointment-settings";
import api from "@/lib/api";

interface ScheduleDialogProps {
  patient: any;
  trigger: React.ReactNode;
}

const ScheduleDialog = ({ patient, trigger }: ScheduleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    type: "",
    doctor: "",
    notes: ""
  });

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
      const response = await api.get(`/appointments?date=${formData.date}`);
      setExistingAppointments(response.data || []);
    } catch (error) {
      console.log("Failed to load existing appointments");
      setExistingAppointments([]);
    }
  };

  // Get available time slots for the selected date
  const getAvailableSlots = () => {
    if (!formData.date) return timeSlots;
    
    const dateObj = new Date(formData.date);
    const availableSlots = getAvailableTimeSlots(dateObj, existingAppointments);
    return availableSlots.map(slot => slot.time);
  };

  // Check if date is within booking window
  const isDateValid = (date: Date) => {
    return isWithinAdvanceBookingWindow(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check for appointment conflicts
      if (formData.date && formData.time) {
        const dateObj = new Date(formData.date);
        const hasConflict = checkAppointmentConflict(
          dateObj, 
          formData.time, 
          30, // default duration
          existingAppointments
        );
        
        if (hasConflict) {
          toast({
            title: "Appointment Conflict",
            description: "This time slot conflicts with an existing appointment. Please choose a different time.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Format date as UTC midnight ISO string
      const dateObj = new Date(formData.date);
      const formattedDate = new Date(Date.UTC(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
      )).toISOString();
      
      const appointmentData = {
        patientName: patient.name,
        patientPhone: patient.phone,
        date: formattedDate,
        time: formData.time,
        type: formData.type,
        duration: "30", // default duration
        notes: formData.notes,
        status: "Pending"
      };
      
      await api.post("/appointments", appointmentData);
      toast({
        title: "Appointment Scheduled",
        description: `Appointment for ${patient.name} has been scheduled for ${formData.date} at ${formData.time}.`,
      });
      setIsLoading(false);
      setIsOpen(false);
      setFormData({ date: "", time: "", type: "", doctor: "", notes: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={patient.name} disabled />
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
                    {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date && isDateValid(date)) {
                        setFormData({...formData, date: date.toISOString().split('T')[0], time: ""});
                      } else if (date) {
                        toast({
                          title: "Invalid Date",
                          description: `Appointments can only be booked up to ${settings.advanceBookingDays} days in advance.`,
                          variant: "destructive"
                        });
                      }
                    }}
                    initialFocus
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
                    <SelectItem key={time} value={time}>
                      {time}
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
              <Select value="30" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
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
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.date || !formData.time}>
              {isLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
