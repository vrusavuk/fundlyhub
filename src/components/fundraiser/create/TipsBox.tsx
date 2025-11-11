import { WIZARD_SPACING, WIZARD_TYPOGRAPHY } from './designConstants';

interface TipsBoxProps {
  title: string;
  tips: string[];
}

export function TipsBox({ title, tips }: TipsBoxProps) {
  return (
    <div className="bg-accent/50 border border-border rounded-lg p-4">
      <h4 className={`${WIZARD_TYPOGRAPHY.subsectionTitle} mb-2`}>{title}</h4>
      <ul className={`${WIZARD_TYPOGRAPHY.helperText} ${WIZARD_SPACING.listItems} list-disc list-inside`}>
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
