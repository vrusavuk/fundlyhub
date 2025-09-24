/**
 * Floating Categories Component - Animated hero elements
 * Displays animated category circles with smooth floating animations
 */
import yourCauseImage from "@/assets/categories/your-cause.jpg";
import medicalImage from "@/assets/categories/medical.jpg";
import emergencyImage from "@/assets/categories/emergency.jpg";
import educationImage from "@/assets/categories/education.jpg";
import animalImage from "@/assets/categories/animal.jpg";
import businessImage from "@/assets/categories/business.jpg";

interface CategoryCircleProps {
  image: string;
  alt: string;
  label: string;
  size: 'small' | 'large';
  position: string;
  animationDelay: string;
  colorClass: string;
}

function CategoryCircle({ image, alt, label, size, position, animationDelay, colorClass }: CategoryCircleProps) {
  const circleSize = size === 'large' ? 'w-20 h-20' : 'w-16 h-16';
  const labelPadding = size === 'large' ? 'px-2 py-1' : 'px-1 py-0.5';
  
  return (
    <div className={`absolute ${position} animate-float`} style={{animationDelay}}>
      <div className="relative">
        <div className={`${circleSize} rounded-full border-4 ${colorClass} bg-white shadow-xl overflow-hidden`}>
          <img src={image} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground ${labelPadding} rounded-full text-xs font-medium shadow-lg`}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function FloatingCategories() {
  const categories = [
    // Left side circles
    {
      image: yourCauseImage,
      alt: "Your cause",
      label: "Your cause",
      size: 'large' as const,
      position: "top-12 left-6",
      animationDelay: '0s',
      colorClass: "border-primary/30"
    },
    {
      image: medicalImage,
      alt: "Medical",
      label: "Medical",
      size: 'small' as const,
      position: "top-48 left-20",
      animationDelay: '1s',
      colorClass: "border-accent/30"
    },
    {
      image: emergencyImage,
      alt: "Emergency",
      label: "Emergency",
      size: 'small' as const,
      position: "top-24 left-32",
      animationDelay: '2s',
      colorClass: "border-success/30"
    },
    // Right side circles
    {
      image: educationImage,
      alt: "Education",
      label: "Education",
      size: 'large' as const,
      position: "top-12 right-6",
      animationDelay: '0.5s',
      colorClass: "border-secondary/30"
    },
    {
      image: animalImage,
      alt: "Animal",
      label: "Animal",
      size: 'small' as const,
      position: "top-48 right-20",
      animationDelay: '1.5s',
      colorClass: "border-warning/30"
    },
    {
      image: businessImage,
      alt: "Business",
      label: "Business",
      size: 'small' as const,
      position: "top-24 right-32",
      animationDelay: '2.5s',
      colorClass: "border-primary/30"
    }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="hidden lg:block relative h-full">
        {categories.map((category, index) => (
          <CategoryCircle
            key={index}
            image={category.image}
            alt={category.alt}
            label={category.label}
            size={category.size}
            position={category.position}
            animationDelay={category.animationDelay}
            colorClass={category.colorClass}
          />
        ))}
      </div>
    </div>
  );
}