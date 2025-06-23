import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, User } from "lucide-react";
import api from "@/lib/api";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  condition: string;
  allergies: string[];
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  abhaId?: string;
  abhaVerified?: boolean;
  status: string;
}

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  condition: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
}

interface PatientFormDialogProps {
  trigger?: React.ReactNode;
  patient?: Patient;
  onSuccess?: () => void;
}

const PatientFormDialog = ({ trigger, patient, onSuccess }: PatientFormDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: patient?.name || "",
    age: patient?.age?.toString() || "",
    gender: patient?.gender || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    condition: patient?.condition || "",
    allergies: patient?.allergies?.join(", ") || "",
    emergencyContact: patient?.emergencyContact || "",
    emergencyPhone: patient?.emergencyPhone || "",
    address: patient?.address || ""
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        age: parseInt(formData.age),
        // Only split allergies if it's a string, otherwise keep as is
        allergies: typeof formData.allergies === 'string' 
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergies
      };

      if (patient) {
        // Update existing patient
        await api.put(`/patients/${patient.id}`, apiData);
        toast({
          title: "Patient Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Create new patient
        await api.post('/patients', apiData);
        toast({
          title: "Patient Added",
          description: `${formData.name} has been added successfully.`,
        });
      }
      
      setIsLoading(false);
      setIsOpen(false);
      onSuccess?.(); // Trigger refresh of patients list
    } catch (error: Error | unknown) {
      console.error('Error saving patient:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save patient";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      validateForm(updated);
      return updated;
    });
  };

  const validateForm = (data = formData) => {
    const errors: {[key: string]: string} = {};
    if (!data.name.trim() || data.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
    const ageNum = Number(data.age);
    if (!data.age.trim() || isNaN(ageNum) || ageNum <= 0 || ageNum > 150) errors.age = "Age must be between 1 and 150.";
    if (!data.gender) errors.gender = "Gender is required.";
    if (!data.phone.trim() || !/^\d{10}$/.test(data.phone.trim())) errors.phone = "Valid 10-digit phone number is required.";
    if (data.email && (data.email.length < 6 || !/^\S+@\S+\.\S+$/.test(data.email))) errors.email = "Enter a valid email address (min 6 chars).";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-medical-500 hover:bg-medical-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-medical-500" />
            {patient ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                required
              />
              {formErrors.name && <div className="text-xs text-red-600 mt-1">{formErrors.name}</div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Enter age"
                required
                min="0"
              />
              {formErrors.age && <div className="text-xs text-red-600 mt-1">{formErrors.age}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.gender && <div className="text-xs text-red-600 mt-1">{formErrors.gender}</div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
              />
              {formErrors.phone && <div className="text-xs text-red-600 mt-1">{formErrors.phone}</div>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
            />
            {formErrors.email && <div className="text-xs text-red-600 mt-1">{formErrors.email}</div>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Primary Condition</Label>
            <Input
              id="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange("condition", e.target.value)}
              placeholder="Enter primary condition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              placeholder="Enter allergies (comma separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                placeholder="Emergency contact name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                placeholder="Emergency phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Object.keys(formErrors).length > 0}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {isLoading ? "Saving..." : patient ? "Update Patient" : "Add Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatientFormDialog;
