import DynamicBoards from './boardsdynamic';
import { getBoards } from '@/server/actions/board';

export default async function Boards() {
    const boardsResponse = await getBoards('Last edited');

    if (!boardsResponse.success || boardsResponse.boards.length === 0) {
        return <p>There are no boards to display</p>;
    }

    return <DynamicBoards initialBoards={boardsResponse.boards} />;
}