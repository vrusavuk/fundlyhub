import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  GraduationCap, 
  Stethoscope, 
  Home, 
  Dog, 
  Globe,
  Users,
  Lightbulb
} from "lucide-react";

const categories = [
  { name: "Medical", icon: Stethoscope, color: "text-red-500", count: 1234 },
  { name: "Education", icon: GraduationCap, color: "text-blue-500", count: 856 },
  { name: "Community", icon: Users, color: "text-green-500", count: 742 },
  { name: "Emergency", icon: Heart, color: "text-pink-500", count: 523 },
  { name: "Animals", icon: Dog, color: "text-purple-500", count: 394 },
  { name: "Environment", icon: Globe, color: "text-emerald-500", count: 287 },
  { name: "Housing", icon: Home, color: "text-orange-500", count: 195 },
  { name: "Innovation", icon: Lightbulb, color: "text-yellow-500", count: 143 },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Card 
            key={category.name}
            className="group cursor-pointer transition-smooth hover:shadow-medium hover:-translate-y-1"
          >
            <CardContent className="p-6 text-center">
              <div className="mb-3">
                <Icon className={`h-8 w-8 mx-auto ${category.color}`} />
              </div>
              <h3 className="font-semibold mb-1">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.count.toLocaleString()} active
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}