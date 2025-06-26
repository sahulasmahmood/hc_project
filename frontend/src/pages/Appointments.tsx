import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, AlertTriangle, Phone, Filter, Search, ChevronLeft, ChevronRight, ArrowRightLeft } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAppointmentSettings } from "@/hooks/settings_hook/use-appointment-settings";
import AppointmentDialog from "@/components/appointments/AppointmentDialog";
import RescheduleDialog from "@/components/appointments/RescheduleDialog";
import TimeSlotSwapDialog from "@/components/appointments/TimeSlotSwapDialog";
import FilterDialog from "@/components/appointments/FilterDialog";
import api from "@/lib/api";

interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  duration: string;
  status: string;
  notes?: string;
  patientVisibleId?: string;
}

const Appointments = () => {
  const { toast } = useToast();
  // Fix timezone issue by creating date string manually
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);
  const [filters, setFilters] = useState({ status: [], type: [], timeRange: "all" });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10); // Show 10 appointments per page
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slotToBook, setSlotToBook] = useState<{date: string, time: string} | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);

  // Use appointment settings hook
  const { 
    settings, 
    loading: settingsLoading, 
    getActiveTimeSlots,
    getAvailableTimeSlots
  } = useAppointmentSettings();

  // Get all possible slots for the selected date
  const allTimeSlots = getActiveTimeSlots().map(slot => slot.time);
  // Get appointments for the selected date
  const appointmentsForDate = appointments.filter(a => a.date.split('T')[0] === selectedDate);
  // Get booked times
  const bookedTimes = appointmentsForDate.map(a => a.time);
  // Get available slots for the selected date
  const availableSlots = getAvailableTimeSlots(new Date(selectedDate), appointmentsForDate).map(slot => slot.time);

  // Helper to get slot status
  const getSlotStatus = (time: string) => {
    if (!allTimeSlots.includes(time)) return 'unavailable';
    if (bookedTimes.includes(time)) return 'booked';
    if (availableSlots.includes(time)) return 'available';
    return 'unavailable';
  };

  // Helper to get slot color
  const getSlotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200';
      case 'booked': return 'bg-red-100 text-red-800 border-red-400 cursor-not-allowed opacity-60';
      case 'unavailable': return 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-50';
      default: return 'bg-gray-100 text-gray-400 border-gray-300';
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Urgent": return "bg-red-100 text-red-800";
      case "Completed": return "bg-blue-100 text-blue-800";
      case "Cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Emergency": return "bg-red-500";
      case "Follow-up": return "bg-blue-500";
      case "Consultation": return "bg-medical-500";
      default: return "bg-gray-500";
    }
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      if (appointmentData.id && appointments.find(a => a.id === appointmentData.id)) {
        // Update existing appointment
        const response = await api.put(`/appointments/${appointmentData.id}`, appointmentData);
        setAppointments(prev => prev.map(a => a.id === appointmentData.id ? response.data : a));
        toast({
          title: "Appointment Updated",
          description: "The appointment has been successfully updated."
        });
      } else {
        // Create new appointment
        const response = await api.post('/appointments', appointmentData);
        setAppointments(prev => [...prev, response.data]);
        toast({
          title: "Appointment Scheduled",
          description: "New appointment has been successfully scheduled."
        });
      }
      // Refresh appointments after save
      fetchAppointments();
      return true; // <-- Success
    } catch (error: any) {
      // Check for backend error message
      const backendMsg = error?.response?.data?.error;
      if (backendMsg === 'Cannot schedule an appointment in the past.') {
        toast({
          title: "Invalid Appointment Time",
          description: "You cannot schedule an appointment in the past. Please select a future time.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save appointment",
          variant: "destructive"
        });
      }
      return false; // <-- Failure
    }
  };

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, { status: "Confirmed" });
      setAppointments(prev => prev.map(a => a.id === appointmentId ? response.data : a));
      toast({
        title: "Appointment Confirmed",
        description: "The appointment has been confirmed."
      });
      // Refresh appointments after confirmation
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm appointment",
        variant: "destructive"
      });
    }
  };

  const handleStartSession = async (appointmentId: number) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, { status: "In Progress" });
      setAppointments(prev => prev.map(a => a.id === appointmentId ? response.data : a));
      toast({
        title: "Session Started",
        description: "The appointment session has begun."
      });
      // Refresh appointments after starting session
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = async (appointmentId: number, newDate: string, newTime: string) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/reschedule`, {
        newDate,
        newTime
      });
      setAppointments(prev => prev.map(a => a.id === appointmentId ? response.data : a));
      toast({
        title: "Appointment Rescheduled",
        description: "The appointment has been rescheduled successfully."
      });
      // Refresh appointments after rescheduling
      fetchAppointments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || "Failed to reschedule appointment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setSelectedAppointmentForReschedule(appointment);
    setRescheduleDialogOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been deleted successfully."
      });
      // Refresh appointments after deletion
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive"
      });
    }
  };

  const handleTimeSlotClick = (time: string) => {
    setSlotToBook({ date: selectedDate, time });
    setDialogOpen(true);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when applying filters
    toast({
      title: "Filters Applied",
      description: "Appointment list has been filtered."
    });
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
    setDialogOpen(false);      // Close dialog if open
    setSlotToBook(null);       // Clear any slot selection
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredAppointments = appointments.filter(appointment => {
    console.log('Filtering appointment:', appointment);
    console.log('Selected date:', selectedDate);
    console.log('Appointment date:', appointment.date);
    
    // Convert appointment date to YYYY-MM-DD format for comparison (timezone-safe)
    const appointmentDateObj = new Date(appointment.date);
    const appointmentYear = appointmentDateObj.getFullYear();
    const appointmentMonth = String(appointmentDateObj.getMonth() + 1).padStart(2, '0');
    const appointmentDay = String(appointmentDateObj.getDate()).padStart(2, '0');
    const appointmentDate = `${appointmentYear}-${appointmentMonth}-${appointmentDay}`;
    console.log('Formatted appointment date:', appointmentDate);
    
    if (appointmentDate !== selectedDate) {
      console.log('Date mismatch');
      return false;
    }
    
    if (filters.status.length > 0 && !filters.status.includes(appointment.status)) {
      console.log('Status filter mismatch');
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(appointment.type)) {
      console.log('Type filter mismatch');
      return false;
    }
    
    if (filters.timeRange !== "all") {
      const hour = parseInt(appointment.time.split(':')[0]);
      const isPM = appointment.time.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : hour;
      
      switch (filters.timeRange) {
        case "morning":
          if (hour24 < 8 || hour24 >= 12) return false;
          break;
        case "afternoon":
          if (hour24 < 12 || hour24 >= 17) return false;
          break;
        case "evening":
          if (hour24 < 17 || hour24 >= 20) return false;
          break;
      }
    }
    
    console.log('Appointment passed all filters');
    return true;
  });

  // Calculate pagination for filtered appointments
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  console.log('Filtered appointments:', filteredAppointments);

  const handleSwapComplete = () => {
    fetchAppointments();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSwapDialogOpen(true)}
            disabled={filteredAppointments.length < 2}
            className="flex items-center gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Swap Slots
          </Button>
          <FilterDialog onApplyFilters={handleApplyFilters} currentFilters={filters} />
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              min={(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()} // <-- disables past dates
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
            <div className="ml-auto text-sm text-gray-600">
              {filteredAppointments.length} appointments scheduled
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      )}

      {/* Appointments List */}
      {!loading && (
        <div className="space-y-4">
          {currentAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-1 h-16 rounded-full ${getTypeColor(appointment.type)}`}></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{appointment.patientName}
                          <span className="ml-2 text-xs text-gray-500 font-mono">{appointment.patientVisibleId}</span>
                        </span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <span>•</span>
                        <span>{appointment.duration} min</span>
                        <span>•</span>
                        <span className="font-medium">{appointment.type}</span>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRescheduleClick(appointment)}
                    >
                      Reschedule
                    </Button>
                    {appointment.status === 'Pending' && (
                      <Button 
                        size="sm" 
                        className="bg-medical-500 hover:bg-medical-600"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {appointment.status === 'Confirmed' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStartSession(appointment.id)}
                      >
                        Start Session
                      </Button>
                    )}
                    {appointment.status === 'Urgent' && (
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleStartSession(appointment.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Handle Urgent
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {filteredAppointments.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500 mb-4">No appointments match your current filters for this date.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-4 py-2 my-2">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
            <span className="text-sm font-medium text-blue-800">Click an <span className="font-semibold underline">available time slot</span> below to schedule a new appointment.</span>
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading time slots...</p>
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {allTimeSlots.map((time) => {
              const status = getSlotStatus(time);
              return (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  className={`text-center border ${getSlotColor(status)}`}
                  onClick={() => status === 'available' && handleTimeSlotClick(time)}
                  disabled={status !== 'available'}
                >
                  {time}
                  {status === 'booked' && <span className="ml-2 text-xs">(Booked)</span>}
                  {status === 'unavailable' && <span className="ml-2 text-xs">(Unavailable)</span>}
                </Button>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
      {/* AppointmentDialog for slot booking */}
      {slotToBook && (
        <AppointmentDialog
          mode="create"
          onSave={handleSaveAppointment}
          selectedDate={slotToBook.date}
          selectedTime={slotToBook.time}
          onClose={() => {
            setDialogOpen(false);
            setSlotToBook(null);
          }}
        />
      )}
      {dialogOpen && !slotToBook && (
        <AppointmentDialog
          mode="create"
          onSave={handleSaveAppointment}
          selectedDate={selectedDate}
          selectedTime={undefined}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {rescheduleDialogOpen && selectedAppointmentForReschedule && (
        <RescheduleDialog
          appointment={selectedAppointmentForReschedule}
          isOpen={rescheduleDialogOpen}
          onReschedule={handleReschedule}
          onClose={() => {
            setRescheduleDialogOpen(false);
            setSelectedAppointmentForReschedule(null);
          }}
        />
      )}
      {swapDialogOpen && (
        <TimeSlotSwapDialog
          isOpen={swapDialogOpen}
          onClose={() => setSwapDialogOpen(false)}
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          onSwapComplete={handleSwapComplete}
        />
      )}
    </div>
  );
};

export default Appointments;
