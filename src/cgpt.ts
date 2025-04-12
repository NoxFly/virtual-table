type Type = { id: any; };

type TreeNode<T extends Type> = T & {
    children?: TreeNode<T>[];
};

type FlattenedNode<T extends Type> = {
    item: TreeNode<T>;
    depth: number;
    parentId?: string;
};

class VirtualizedTree<T extends Type> {
    private flattenedList: FlattenedNode<T>[] = [];
    private expandedNodes: Set<string> = new Set();
    private nodeIndexMap: Map<string, number> = new Map();

    constructor(private treeData: TreeNode<T>[]) {
        this.buildInitialFlattenedList();
    }

    /** 🔹 Génère la liste aplatie initiale */
    private buildInitialFlattenedList() {
        this.flattenedList = [];
        this.nodeIndexMap.clear();
        this.traverseAndAdd(this.treeData, 0);
    }

    /** 🔹 Traverse l'arbre et ajoute uniquement les nœuds visibles */
    private traverseAndAdd(nodes: TreeNode<T>[], depth: number, parentId?: string, insertAt?: number) {
        let insertIndex = insertAt ?? this.flattenedList.length;
        for (const node of nodes) {
            const nodeId = this.getNodeId(node);
            this.flattenedList.splice(insertIndex, 0, { item: node, depth, parentId });
            this.nodeIndexMap.set(nodeId, insertIndex);
            insertIndex++;

            if (this.expandedNodes.has(nodeId) && node.children?.length) {
                insertIndex = this.traverseAndAdd(node.children, depth + 1, nodeId, insertIndex);
            }
        }
        return insertIndex;
    }

    /** 🔹 Gère l'expansion/collapse d'un nœud */
    public toggleExpand(node: TreeNode<T>) {
        const nodeId = this.getNodeId(node);
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
            this.removeSubtree(nodeId);
        } else {
            this.expandedNodes.add(nodeId);
            this.addSubtree(node);
        }
    }

    /** 🔹 Ajoute dynamiquement un sous-arbre dans `flattenedList` */
    private addSubtree(node: TreeNode<T>) {
        const nodeId = this.getNodeId(node);
        const parentIndex = this.nodeIndexMap.get(nodeId);
        if (parentIndex === undefined || !node.children) return;

        this.traverseAndAdd(node.children, this.flattenedList[parentIndex].depth + 1, nodeId, parentIndex + 1);
    }

    /** 🔹 Supprime dynamiquement un sous-arbre de `flattenedList` */
    private removeSubtree(nodeId: string) {
        const startIdx = this.nodeIndexMap.get(nodeId);
        if (startIdx === undefined) return;

        let deleteCount = 0;
        for (let i = startIdx + 1; i < this.flattenedList.length; i++) {
            if (this.flattenedList[i].parentId === nodeId || this.expandedNodes.has(this.flattenedList[i].item.id)) {
                deleteCount++;
            } else {
                break;
            }
        }

        // Supprimer les nœuds et mettre à jour la map
        this.flattenedList.splice(startIdx + 1, deleteCount);
        this.rebuildIndexMap();
    }

    /** 🔹 Reconstruit la map `nodeIndexMap` après suppression */
    private rebuildIndexMap() {
        this.nodeIndexMap.clear();
        for (let i = 0; i < this.flattenedList.length; i++) {
            this.nodeIndexMap.set(this.getNodeId(this.flattenedList[i].item), i);
        }
    }

    /** 🔹 Récupère la liste des nœuds visibles */
    public getVisibleNodes(): FlattenedNode<T>[] {
        return this.flattenedList;
    }

    /** 🔹 Suppose que chaque nœud a un ID unique */
    private getNodeId(node: TreeNode<T>): string {
        return (node as any).id;
    }
}