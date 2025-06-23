
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Clock, User, Phone, MapPin, Activity, Siren, Heart, Zap } from "lucide-react";

const Emergency = () => {
  const [selectedPriority, setSelectedPriority] = useState("all");

  const emergencyCases = [
    {
      id: 1,
      caseId: "EM001",
      patientName: "Rajesh Verma",
      age: 45,
      gender: "Male",
      phone: "+91 98765 43210",
      chiefComplaint: "Chest pain and difficulty breathing",
      arrivalTime: "2024-01-25 14:30",
      triagePriority: "Critical",
      assignedTo: "Dr. Rajesh Kumar",
      status: "In Treatment",
      vitals: {
        bp: "180/110",
        pulse: "120",
        temp: "99.2°F",
        spo2: "92%"
      }
    },
    {
      id: 2,
      caseId: "EM002",
      patientName: "Priya Sharma",
      age: 28,
      gender: "Female",
      phone: "+91 98765 43211",
      chiefComplaint: "Severe abdominal pain",
      arrivalTime: "2024-01-25 15:15",
      triagePriority: "High",
      assignedTo: "Dr. Anjali Patel",
      status: "Waiting",
      vitals: {
        bp: "140/90",
        pulse: "95",
        temp: "101.5°F",
        spo2: "98%"
      }
    },
    {
      id: 3,
      caseId: "EM003",
      patientName: "Amit Kumar",
      age: 35,
      gender: "Male",
      phone: "+91 98765 43212",
      chiefComplaint: "Minor cut on hand",
      arrivalTime: "2024-01-25 15:45",
      triagePriority: "Low",
      assignedTo: "Dr. Meera Singh",
      status: "Discharged",
      vitals: {
        bp: "120/80",
        pulse: "78",
        temp: "98.6°F",
        spo2: "99%"
      }
    }
  ];

  const triageProtocols = [
    {
      priority: "Critical",
      color: "Red",
      description: "Life-threatening conditions",
      examples: ["Cardiac arrest", "Severe trauma", "Respiratory failure", "Stroke"],
      waitTime: "Immediate"
    },
    {
      priority: "High",
      color: "Orange",
      description: "Urgent conditions",
      examples: ["Chest pain", "Severe bleeding", "High fever", "Fractures"],
      waitTime: "10-15 minutes"
    },
    {
      priority: "Medium",
      color: "Yellow",
      description: "Semi-urgent conditions",
      examples: ["Moderate pain", "Vomiting", "Minor burns", "Sprains"],
      waitTime: "30-60 minutes"
    },
    {
      priority: "Low",
      color: "Green",
      description: "Non-urgent conditions",
      examples: ["Minor cuts", "Cold symptoms", "Prescription refills"],
      waitTime: "1-2 hours"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Treatment": return "bg-blue-100 text-blue-800";
      case "Waiting": return "bg-yellow-100 text-yellow-800";
      case "Discharged": return "bg-green-100 text-green-800";
      case "Admitted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Siren className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-gray-900">Emergency Department</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600">
              <Plus className="h-4 w-4 mr-2" />
              New Emergency Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register Emergency Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Patient Name" />
                <Input placeholder="Age" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Phone Number" />
              </div>
              <div>
                <label className="text-sm font-medium">Chief Complaint</label>
                <Textarea placeholder="Describe the main symptoms or condition..." />
              </div>
              <div>
                <label className="text-sm font-medium">Triage Priority</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical (Red)</SelectItem>
                    <SelectItem value="high">High (Orange)</SelectItem>
                    <SelectItem value="medium">Medium (Yellow)</SelectItem>
                    <SelectItem value="low">Low (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Input placeholder="BP" />
                <Input placeholder="Pulse" />
                <Input placeholder="Temperature" />
                <Input placeholder="SpO2" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-red-500 hover:bg-red-600">Register Case</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {emergencyCases.filter(c => c.triagePriority === "Critical").length}
            </div>
            <div className="text-sm text-gray-600">Critical Cases</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {emergencyCases.filter(c => c.triagePriority === "High").length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {emergencyCases.filter(c => c.status === "In Treatment").length}
            </div>
            <div className="text-sm text-gray-600">In Treatment</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {emergencyCases.filter(c => c.status === "Waiting").length}
            </div>
            <div className="text-sm text-gray-600">Waiting</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="triage">Triage Protocols</TabsTrigger>
          <TabsTrigger value="resources">Emergency Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Alert
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {emergencyCases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-lg">{case_.caseId}</div>
                        <Badge className={getPriorityColor(case_.triagePriority)}>
                          {case_.triagePriority}
                        </Badge>
                        <Badge className={getStatusColor(case_.status)}>
                          {case_.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{case_.patientName}</span>
                        <span className="text-sm text-gray-600">({case_.age}Y, {case_.gender})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{case_.phone}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{case_.arrivalTime}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Assigned to: {case_.assignedTo}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Chief Complaint:</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{case_.chiefComplaint}</div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">BP</span>
                      </div>
                      <div className="text-sm font-semibold">{case_.vitals.bp}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium">Pulse</span>
                      </div>
                      <div className="text-sm font-semibold">{case_.vitals.pulse}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs font-medium">Temp</span>
                      </div>
                      <div className="text-sm font-semibold">{case_.vitals.temp}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium">SpO2</span>
                      </div>
                      <div className="text-sm font-semibold">{case_.vitals.spo2}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                      Update Status
                    </Button>
                    <Button variant="outline" size="sm">
                      View Full Chart
                    </Button>
                    <Button variant="outline" size="sm">
                      Transfer
                    </Button>
                    {case_.triagePriority === "Critical" && (
                      <Button size="sm" className="bg-red-500 hover:bg-red-600">
                        Emergency Protocol
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="triage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {triageProtocols.map((protocol, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      protocol.color === "Red" ? "bg-red-500" :
                      protocol.color === "Orange" ? "bg-orange-500" :
                      protocol.color === "Yellow" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}></div>
                    <span>{protocol.priority} Priority</span>
                    <Badge variant="outline">{protocol.color}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium text-sm mb-2">Description:</div>
                    <div className="text-sm text-gray-600">{protocol.description}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm mb-2">Common Examples:</div>
                    <div className="space-y-1">
                      {protocol.examples.map((example, idx) => (
                        <div key={idx} className="text-sm bg-gray-50 px-2 py-1 rounded">
                          • {example}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Wait Time:</span>
                    <span>{protocol.waitTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Emergency Resources</h3>
                <p className="text-gray-600">Emergency equipment tracking and protocols coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Emergency;
