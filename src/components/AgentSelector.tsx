import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Agent = {
  id: string;
  name: string;
};

const agents: Agent[] = [
  { id: "agent_2401k467207hefr83sq8vsfkj5ys", name: "Ola" },
  { id: "agent_5601k49hjdh5fhmbdqhs6j50a10w", name: "Elin" },
  { id: "agent_5801k49gsgmbfwz97js52x2xd2vp", name: "Sanna" },
  { id: "agent_0501k49gxw80fantcxhw3nddggnk", name: "Adam" },
  { id: "agent_9401k49h8jm3fp195vq5m4ms7kks", name: "Martin" }
];

interface AgentSelectorProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

export const AgentSelector = ({ selectedAgent, onAgentChange, disabled }: AgentSelectorProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Välj tillsynsassistent</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAgent}
          onValueChange={onAgentChange}
          disabled={disabled}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center space-x-2">
              <RadioGroupItem
                value={agent.id}
                id={agent.id}
                className="peer"
              />
              <Label
                htmlFor={agent.id}
                className="text-sm font-medium cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {agent.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};