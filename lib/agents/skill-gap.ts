export type SkillGapItem = {
  skill: string;
  difficulty: 'Low' | 'Medium' | 'High';
  estimatedLearningTime: string;
  importance: 'Low' | 'Medium' | 'High';
  priority: number;
};

export async function calculateSkillGap(currentSkills: string[], targetSkills: string[]): Promise<{ missingSkills: SkillGapItem[] }> {
  const missingSkills = targetSkills
    .filter((skill) => !currentSkills.some((current) => current.toLowerCase() === skill.toLowerCase()))
    .slice(0, 12)
    .map((skill, index) => ({
      skill,
      difficulty: 'Medium' as const,
      estimatedLearningTime: '2-4 weeks',
      importance: 'High' as const,
      priority: index + 1
    }));

  return { missingSkills };
}
