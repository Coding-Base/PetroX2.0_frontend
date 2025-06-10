// src/components/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaUsers, FaComments, FaCalculator, FaFileUpload, FaGraduationCap, FaRobot } from 'react-icons/fa';
import image1 from './land1.png'
import image2 from './land2.png'
const LandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const observer = useRef(null);
  
 const slides = [
    {
      title: "Elevate Your Academic Journey",
      subtitle: "Access premium study materials and collaborative tools",
      image: image1
    },
    {
      title: "Master Your Subjects",
      subtitle: "Personalized learning with PetroMark AI assistant",
      image: image2
    },
    {
      title: "Collaborate & Succeed",
      subtitle: "Create group tests and study with peers",
      image: image1
    }
  ];
  // Preloader effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);

  // Scroll detection for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.animate-section');
    sections.forEach(section => observer.current.observe(section));

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-wider">
            <span className="text-indigo-400">PETRO</span><span className="text-amber-400">X</span>
          </h1>
          <p className="mt-4 text-gray-400 font-light">Preparing your learning experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative overflow-hidden h-[90vh]">
        {/* Carousel */}
         <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Image with 20% opacity */}
              <div 
                className="absolute inset-0 opacity-90 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              ></div>
              
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
          ))}
        </div>
        
         {/* Navigation */}
        <nav className={`fixed w-full py-4 px-6 md:px-12 flex justify-between items-center z-30 transition-all duration-300 ${
          scrolled ? 'bg-gray-900/90 backdrop-blur-sm' : 'bg-transparent'
        }`}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-wider">
              <span className="text-indigo-400">PETRO</span><span className="text-amber-400">X</span>
            </h1>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-200 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-200 hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="text-gray-200 hover:text-white transition-colors">Testimonials</a>
          </div>
          
          <div>
            <Link 
              to="/signin" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
              {slides[currentSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/signup" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded transition-all"
              >
                Create Free Account
              </Link>
              <Link 
                to="/features" 
                className="bg-transparent border border-gray-300 hover:bg-white/10 text-white font-medium py-3 px-8 rounded transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </header>

      {/* Features Section */}
      <section  style={{ marginTop: '-900px' }}
        id="features" 
        className={`py-20 px-6 md:px-12 bg-white animate-section transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Powerful Learning Tools</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              PetroX provides everything you need to excel academically
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white p-8 rounded-lg border border-gray-200 transition-all duration-300 hover:border-indigo-300 hover:shadow-md ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-indigo-600 text-3xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="py-20 px-6 md:px-12 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">How PetroX Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A seamless learning experience designed for academic success
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="bg-gray-100 border border-gray-300 rounded-lg w-full h-80 flex items-center justify-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64" />
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-700 rounded-lg w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-xl font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-0.5 shadow-sm">
                <div className="bg-white rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to get started?</h3>
                      <p className="text-gray-600">Join thousands of students already using PetroX</p>
                    </div>
                    <Link 
                      to="/signup" 
                      className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded transition-all"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        className="py-20 px-6 md:px-12 bg-gray-900 text-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Hear from students who have transformed their academic journey with PetroX
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-indigo-400">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{testimonial.name}</h4>
                    <p className="text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="mb-4 text-gray-300">"{testimonial.quote}"</p>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 text-indigo-700 rounded-lg w-12 h-12 flex items-center justify-center mr-4">
                    <FaRobot className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">PetroMark AI Assistant</h3>
                    <p className="text-gray-600">Your personal learning companion</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-gray-100 border border-gray-300 rounded-full w-8 h-8 mr-3 flex items-center justify-center text-sm">
                      AI
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg rounded-tl-none">
                      <p className="text-gray-800">How can I help with your studies today?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-end">
                    <div className="bg-indigo-600 text-white p-4 rounded-lg rounded-tr-none max-w-xs">
                      <p>Can you explain quantum physics concepts?</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 mb-3 font-medium">PetroMark is ready to assist with:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {aiFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Intelligent Learning with <span className="text-indigo-600">PetroMark AI</span>
              </h2>
              <p className="text-gray-600 mb-8">
                Our advanced AI assistant provides personalized tutoring, answers your questions in real-time, and helps you master complex subjects through interactive learning.
              </p>
              
              <ul className="space-y-4 mb-8">
                {aiBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-indigo-100 text-indigo-600 rounded-full p-1 mt-1 mr-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/petromark" 
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded transition-all"
              >
                <FaRobot className="mr-2" />
                Try PetroMark Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-indigo-400">PETRO</span><span className="text-amber-400">X</span>
              </h3>
              <p className="text-gray-400 mb-6">
                The ultimate academic platform for students seeking excellence.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url} 
                    className="bg-gray-800 text-gray-300 rounded w-8 h-8 flex items-center justify-center transition-colors hover:bg-gray-700"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4 text-gray-200">Resources</h4>
              <ul className="space-y-2">
                {resources.map((resource, index) => (
                  <li key={index}>
                    <a href={resource.url} className="text-gray-400 hover:text-white transition-colors">
                      {resource.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4 text-gray-200">Features</h4>
              <ul className="space-y-2">
                {featureLinks.map((feature, index) => (
                  <li key={index}>
                    <a href={feature.url} className="text-gray-400 hover:text-white transition-colors">
                      {feature.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4 text-gray-200">Stay Updated</h4>
              <p className="text-gray-400 mb-4">
                Subscribe to our newsletter for updates
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-gray-800 text-white px-4 py-2 rounded-l focus:outline-none w-full"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} PetroX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Data arrays
const features = [
  {
    icon: <FaBook />,
    title: "Study Materials",
    description: "Access thousands of resources, textbooks, and past questions for all subjects.",
    tags: ["Resources", "Textbooks", "Past Questions"]
  },
  {
    icon: <FaUsers />,
    title: "Group Tests",
    description: "Create and join collaborative tests with peers to prepare for exams.",
    tags: ["Collaborative", "Real-time", "Custom Tests"]
  },
  {
    icon: <FaComments />,
    title: "Live Chat",
    description: "Connect with other students for study sessions and discussions.",
    tags: ["Real-time", "Study Groups", "Collaboration"]
  },
  {
    icon: <FaCalculator />,
    title: "GP Calculator",
    description: "Calculate your GPA and CGPA instantly with our academic calculator.",
    tags: ["GPA", "CGPA", "Tracking"]
  },
  {
    icon: <FaFileUpload />,
    title: "Material Upload",
    description: "Share study materials and earn recognition for contributions.",
    tags: ["Upload", "Badges", "Community"]
  },
  {
    icon: <FaGraduationCap />,
    title: "Past Questions",
    description: "Access past exam questions with solutions and analytics.",
    tags: ["Exams", "Solutions", "Analytics"]
  }
];

const steps = [
  {
    title: "Create Your Profile",
    description: "Set up your academic profile in minutes"
  },
  {
    title: "Access Resources",
    description: "Browse our library of textbooks and study materials"
  },
  {
    title: "Join Study Groups",
    description: "Connect with peers and create collaborative sessions"
  },
  {
    title: "Track Progress",
    description: "Use our tools to monitor your academic journey"
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Medical Student",
    quote: "PetroX transformed how I prepare for exams. The group tests feature helped me collaborate effectively."
  },
  {
    name: "David Chen",
    role: "Engineering Student",
    quote: "The GP calculator and PetroMark AI have been game-changers. Improved my GPA significantly."
  },
  {
    name: "Amanda Rodriguez",
    role: "Law Student",
    quote: "Finding quality study materials used to take hours. With PetroX, everything is in one place."
  }
];

const aiFeatures = [
  "Concept Explanations",
  "Homework Help",
  "Study Planning",
  "Practice Questions",
  "Research Assistance",
  "Exam Preparation"
];

const aiBenefits = [
  "24/7 personalized tutoring in any subject",
  "Instant answers to complex questions",
  "Adaptive learning paths based on progress",
  "Comprehensive explanations with examples",
  "Study recommendations based on syllabus"
];

const socialLinks = [
  { name: "Facebook", icon: "FB", url: "#" },
  { name: "Twitter", icon: "TW", url: "#" },
  { name: "Instagram", icon: "IG", url: "#" },
  { name: "LinkedIn", icon: "IN", url: "#" }
];

const resources = [
  { name: "Blog", url: "#" },
  { name: "Help Center", url: "#" },
  { name: "Community", url: "#" },
  { name: "Study Guides", url: "#" }
];

const featureLinks = [
  { name: "Study Materials", url: "#" },
  { name: "Group Tests", url: "#" },
  { name: "Live Chat", url: "#" },
  { name: "GP Calculator", url: "#" },
  { name: "PetroMark AI", url: "#" }
];

export default LandingPage;