import { Router } from 'express';
import * as paymentController from  '../../controllers/paymentController.js';

const router = Router();

router.route('/:merchantUserId')
    .get(paymentController.initiatePayment)

router.route('/redirect/:merchantTransactionId')
    .get(paymentController.paymentStatus)

router.route('/callback/:merchantTransactionId')
    .post(paymentController.callback)

router.all('*', (req, res) => {
    res.status(404).json({ message: '404 Resource Not Found' });
})
    
        
export default router;
