import { useState, useEffect } from "react";

// Import all interviewer images
import interviewer1 from "../assets/interviewer1.jpg";
import interviewer2 from "../assets/interviewer2.jpg";
import interviewer3 from "../assets/interviewer3.jpg";
import interviewer4 from "../assets/interviewer4.jpg";
import interviewer5 from "../assets/interviewer5.jpg";
import oig1 from "../assets/OIG1.jpg";

const interviewerImages = [
  interviewer1,
  interviewer2,
  interviewer3,
  interviewer4,
  interviewer5,
  oig1
];

export default function Interviewer({ className = "" }) {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Select a random image when component mounts
    const randomIndex = Math.floor(Math.random() * interviewerImages.length);
    setSelectedImage(interviewerImages[randomIndex]);
  }, []);

  if (!selectedImage) {
    return null; // Don't render anything until image is selected
  }

  return (
    <div className={`interviewer-container ${className} flex items-center justify-center`}>
      <img
        src={selectedImage}
        alt="AI Interviewer"  
        className="w-1/4 h-1/4 object-cover rounded-lg shadow-md"
      />
    </div>
  );
}