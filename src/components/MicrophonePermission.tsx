
import { FC } from "react";

interface MicrophonePermissionProps {
  permissionGranted: boolean | null;
}

const MicrophonePermission: FC<MicrophonePermissionProps> = ({ permissionGranted }) => {
  if (permissionGranted === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Mikrofontillstånd krävs</h2>
        <p className="text-gray-600 text-center">
          Denna funktion kräver tillgång till mikrofonen för att fungera. Vänligen aktivera mikrofontillstånd i dina webbläsarinställningar.
        </p>
      </div>
    );
  }

  return null;
};

export default MicrophonePermission;
