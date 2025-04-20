import { MessagesSquare } from "lucide-react";

// Define Keyframes for the animations
const keyframes = `
  @keyframes ripple-wave {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  @keyframes logo-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.25); }
  }

  @keyframes fade-slide-in {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

const AuthImagePattern = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 p-12 relative overflow-hidden">
      {/* Inject keyframes into the component's scope */}
      <style>{keyframes}</style>

      {/* Animated Waves Container */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="relative w-40 h-40">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{
                animation: `ripple-wave 2.5s ease-out infinite`,
                animationDelay: `${i * 0.5}s`, // Stagger the waves
              }}
            />
          ))}
        </div>
      </div>

      {/* Centered Logo - Add pulsing animation */}
      <div
        className="relative z-10 flex items-center justify-center w-32 h-32 mb-8 bg-base-200 rounded-full shadow-lg"
        style={{ animation: `logo-pulse 3s ease-in-out infinite` }}
      >
        <MessagesSquare className="w-16 h-16 text-primary" />
      </div>

      {/* Text Content - Add fade/slide animation */}
      <div className="relative z-10 max-w-md text-center">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ animation: `fade-slide-in 0.5s ease-out forwards`, animationDelay: `0.2s` }}
        >
          {title}
        </h2>
        <p
          className="text-base-content/60"
          style={{ animation: `fade-slide-in 0.5s ease-out forwards`, animationDelay: `0.4s` }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
