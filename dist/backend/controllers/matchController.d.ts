import { Request, Response } from 'express';
export declare function getCurrentMatch(_req: Request, res: Response): Promise<void>;
export declare function startMatch(req: Request, res: Response): Promise<void>;
export declare function endMatch(req: Request, res: Response): Promise<void>;
export declare function cancelMatch(req: Request, res: Response): Promise<void>;
export declare function forfeitMatch(req: Request, res: Response): Promise<void>;
export declare function startMatchFromQueue(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=matchController.d.ts.map