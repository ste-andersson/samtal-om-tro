import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  console.log("AgentSelector rendering with:", { selectedAgent, disabled });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Välj tillsynsassistent</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={selectedAgent} 
          onValueChange={onAgentChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-0.5">
            {agents.map((agent) => (
              <TabsTrigger
                key={agent.id}
                value={agent.id}
                disabled={disabled}
                className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {agent.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};