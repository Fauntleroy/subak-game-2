export default GameHeader;
type GameHeader = {
    $on?(type: string, callback: (e: any) => void): () => void;
    $set?(props: Partial<Record<string, never>>): void;
};
declare const GameHeader: import("svelte").Component<Record<string, never>, {}, "">;
