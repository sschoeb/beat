import { Request, Response } from 'express';
export declare function getQueue(_req: Request, res: Response): Promise<void>;
export declare function addToQueue(req: Request, res: Response): Promise<void>;
export declare function getNextFromQueue(_req: Request, res: Response): Promise<void>;
export declare function removeFromQueue(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=queueController.d.ts.map