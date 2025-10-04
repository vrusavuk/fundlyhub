import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, GitBranch, RefreshCw, AlertTriangle } from "lucide-react";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const EventsSagas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Saga Pattern</h1>
        <p className="text-xl text-muted-foreground">
          Orchestrating complex workflows with automatic compensation
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>What is a Saga?</AlertTitle>
        <AlertDescription>
          A saga is a sequence of local transactions where each transaction updates data within a single service. 
          If a step fails, the saga executes compensating transactions to undo the changes made by preceding steps.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Campaign Creation Saga
          </CardTitle>
          <CardDescription>Multi-step orchestration for creating fundraising campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The CampaignCreationSaga orchestrates the following steps:
          </p>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg border-l-4 border-l-blue-500">
              <div className="font-semibold mb-1">Step 1: Validate Slug</div>
              <p className="text-sm text-muted-foreground">
                Ensures the campaign slug is unique and valid
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compensation: N/A (validation only)</p>
            </div>

            <div className="p-4 border rounded-lg border-l-4 border-l-green-500">
              <div className="font-semibold mb-1">Step 2: Create Campaign Record</div>
              <p className="text-sm text-muted-foreground">
                Inserts the campaign into the <code>fundraisers</code> table
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compensation: Soft delete campaign</p>
            </div>

            <div className="p-4 border rounded-lg border-l-4 border-l-purple-500">
              <div className="font-semibold mb-1">Step 3: Update User Role</div>
              <p className="text-sm text-muted-foreground">
                Promotes user from 'visitor' to 'creator' status
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compensation: Revert to previous role</p>
            </div>

            <div className="p-4 border rounded-lg border-l-4 border-l-orange-500">
              <div className="font-semibold mb-1">Step 4: Create Projections</div>
              <p className="text-sm text-muted-foreground">
                Initializes CQRS projection tables for the campaign
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compensation: Delete projection records</p>
            </div>

            <div className="p-4 border rounded-lg border-l-4 border-l-pink-500">
              <div className="font-semibold mb-1">Step 5: Update Profile Statistics</div>
              <p className="text-sm text-muted-foreground">
                Updates user's campaign count and profile stats
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compensation: Decrement counters</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Saga State Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground mb-3">
            Saga state is tracked in dedicated database tables:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">saga_instances Table</h4>
              <CodeBlock
                language="typescript"
                code={`interface SagaInstance {
  id: uuid;
  saga_type: string;           // 'campaign_creation'
  aggregate_id: uuid;           // Campaign ID
  status: 'pending' | 'completed' | 'failed' | 'compensating';
  current_step: number;
  data: jsonb;                  // Saga context data
  error_message?: string;
  created_at: timestamp;
  updated_at: timestamp;
  completed_at?: timestamp;
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">saga_steps Table</h4>
              <CodeBlock
                language="typescript"
                code={`interface SagaStep {
  id: uuid;
  saga_id: uuid;
  step_number: number;
  step_name: string;            // 'validate_slug'
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  attempt_count: number;
  error_message?: string;
  executed_at?: timestamp;
  compensated_at?: timestamp;
}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Failure Handling & Compensation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            When a saga step fails, the system automatically triggers compensation:
          </p>

          <CodeBlock
            language="typescript"
            code={`// Example: Campaign creation fails at step 3
Saga Execution Flow:
1. ✅ Validate Slug → Success
2. ✅ Create Campaign → Success (campaign ID: abc-123)
3. ❌ Update User Role → Failure (database constraint violation)

Compensation Flow (Automatic):
3. ⏪ Update User Role → N/A (nothing to compensate)
2. ⏪ Create Campaign → Soft delete campaign abc-123
1. ⏪ Validate Slug → N/A (validation only)

Final State:
- Saga status: 'failed'
- Campaign: Soft deleted with deleted_at timestamp
- User: Remains in previous role
- Error logged in saga_instances.error_message`}
          />

          <Alert className="border-orange-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Compensation Guarantees</AlertTitle>
            <AlertDescription>
              Each saga step implements compensation logic to ensure the system can return to a consistent state.
              Compensation is idempotent and can be safely retried.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring Saga Execution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Query saga state for debugging and monitoring:
          </p>

          <CodeBlock
            language="sql"
            code={`-- Get all failed sagas in last 24 hours
SELECT 
  si.id,
  si.saga_type,
  si.aggregate_id,
  si.current_step,
  si.error_message,
  si.created_at
FROM saga_instances si
WHERE si.status = 'failed'
  AND si.created_at > NOW() - INTERVAL '24 hours'
ORDER BY si.created_at DESC;

-- Get detailed step breakdown for a saga
SELECT 
  ss.step_number,
  ss.step_name,
  ss.status,
  ss.attempt_count,
  ss.error_message,
  ss.executed_at,
  ss.compensated_at
FROM saga_steps ss
WHERE ss.saga_id = 'your-saga-id'
ORDER BY ss.step_number;`}
          />
        </CardContent>
      </Card>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Admin Dashboard Integration</AlertTitle>
        <AlertDescription>
          Super admins can monitor saga execution, failed steps, and compensation history through the 
          Event Monitoring dashboard at <code>/admin/event-monitoring</code>.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EventsSagas;
