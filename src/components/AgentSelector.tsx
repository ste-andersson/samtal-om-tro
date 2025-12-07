import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Agent = {
  id: string;
  name: string;
};

const agents: Agent[] = [
  { id: "agent_7801kb32a955esra733k8dnxpdeb", name: "Ola" },
  { id: "agent_7101kbvz89d4ebfvr8pq6h0njx7y", name: "Elin" },
  { id: "agent_6201kbvzn30tfb5sk2t8mz433x0b", name: "Sanna" },
  { id: "agent_0501kbw01gz6fy2847afz8va34r9", name: "Adam" },
  { id: "agent_9201kbw0f0ctfpxrwkcbqas8ar3k", name: "Mathias" }
];

interface AgentSelectorProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

export const AgentSelector = ({ selectedAgent, onAgentChange, disabled }: AgentSelectorProps) => {
  console.log("AgentSelector rendering with:", { selectedAgent, disabled });
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Välj samtalspartner</CardTitle>
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