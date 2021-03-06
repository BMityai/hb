import HalykBankDbRepositoryInterface from './HalykBankDbRepositoryInterface';
import Database from 'sosise-core/build/Database/Database';
import dbConfig from '../../config/database';
import CrmOrderType from '../Types/CrmOrderType';
import { isEmpty, isNull } from 'lodash';
import HalykBankOrderType from '../Types/HalykBankOrderType';
import ConfirmOrderInfoType from '../Types/ConfirmOrderInfoType';
import { threadId } from 'node:worker_threads';



export default class HalykBankDbRepository implements HalykBankDbRepositoryInterface {


    private dbConnection: Database;

    /**
     * Constructor
     */
    constructor() {
        this.dbConnection = Database.getConnection(dbConfig.default as string);
    }

    /**
     * Save order from crm
     */
    public async saveOrder(crmOrder: CrmOrderType): Promise<number> {
        const orderIds = await this.dbConnection.client.table('orders')
            .insert({
                status: 'wait',
                number: crmOrder.number,
                cart_amount: crmOrder.cartAmount,
                site: crmOrder.site,
                delivery_type: crmOrder.delivery.type,
                delivery_city: crmOrder.delivery.city,
                delivery_address: crmOrder.delivery.address,
                pickup_point_name: crmOrder.delivery.pickupPointName,
                credit_code: crmOrder.payment.creditCode,
                payment_id: crmOrder.payment.paymentId,
                created_date: crmOrder.createdDate,
                created_at: new Date(),
                updated_at: new Date()
            });
        return orderIds[0];
    }

    /**
     *  Save spend bonuses
 
   */
    public async saveSpendBonuses(spendBonuses: number, orderId: number): Promise<void> {
        await this.dbConnection.client.table('products').insert(
            {
                order_id: orderId,
                price: 0 - Math.abs(spendBonuses),
                name: 'Оплата бонусами',
                is_service: false,
                quantity: 1,
                group: 'Payd with bonuses',
                brand: 'MHV Bonuses',
                article: 'MHV_Bonuses',
                created_at: new Date(),
                updated_at: new Date()
            }
        )
    }

    /**
     * Save customer phone
     */
    public async saveCustomerPhone(phoneNumber: string, orderId: number): Promise<void> {
        await this.dbConnection.client.table('customers').insert({
            phone: phoneNumber,
            order_id: orderId,
            created_at: new Date,
            updated_at: new Date()
        })
    }

    /**
     * Save order per product
     */
    public async savePerProduct(product, orderId: number): Promise<void> {
        await this.dbConnection.client.table('products').insert(
            {
                order_id: orderId,
                price: product.price,
                name: product.name,
                is_service: false,
                quantity: product.quantity,
                group: product.group,
                article: product.article,
                created_at: new Date(),
                updated_at: new Date()
            }
        )
    }

    /**
     * Save services
     */
    public async saveService(deliveryInfo: any, orderId: number): Promise<void> {
        await this.dbConnection.client.table('products').insert({
            order_id: orderId,
            price: deliveryInfo.price,
            name: 'Доставка',
            is_service: true,
            quantity: 1,
            brand: 'MHV Delivery Service',
            group: 'Сервис / Доставка',
            article: 'dost-' + orderId, // Банк не знает какое значение передавать в это поле, попросили любое, но не пустое
            created_at: new Date(),
            updated_at: new Date()

        })
    }

    /**
     * Edit comment
     */
    public async editComment(orderId: number, message: string): Promise<void> {
        const order = await this.dbConnection.client.table('orders').select('system_comment').where('id', orderId).first();
        await this.dbConnection.client.table('orders').where('id', orderId).update({
            system_comment: !isNull(order.system_comment)
                ? order.system_comment + new Date().toLocaleString() + ' - ' + message + '  \n'
                : new Date().toLocaleString() + ' - ' + message + '  \n',
            updated_at: new Date()
        });

    }


    /**
     * Get order by number
     */
    public async getOrderByNumber(ordreNumber: string): Promise<HalykBankOrderType | null> {
        // Get order from db
        const order = await this.dbConnection.client
            .table('orders')
            .where('number', ordreNumber)
            .first();

        if (!order) {
            return null;
        }

        // Get order products
        const products = await this.getOrderProducts(order.id);

        // Prepare order
        const halykBankOrder = new HalykBankOrderType(order);

        // Set products
        if (!isNull(products)) {
            halykBankOrder.setGoods(products);
        }
        return halykBankOrder;
    }


    /**
     * Get order products
     */
    private async getOrderProducts(orderId: number): Promise<any> {
        return await this.dbConnection.client.table('products').where('order_id', orderId);
    }

    /**
     * Change order status
     */
    public async changeOrderStatus(orderId: number, status: string): Promise<void> {
        await this.dbConnection.client
            .table('orders')
            .select('system_comment')
            .where('id', orderId)
            .first()
            .update({
                status: status,
                updated_at: new Date()
            });
    }

    /**
     * Confirm order
     */
    public async confirmOrder(confirmOrderInfo: ConfirmOrderInfoType): Promise<void> {
        const isConfirm = confirmOrderInfo.isConfirm;
        await this.dbConnection.client.table('orders')
            .where('number', confirmOrderInfo.orderNumber)
            .first()
            .update({
                is_confirm: isConfirm,
                status: isConfirm ? 'approved by bank' : 'denied by bank',
                business_key: confirmOrderInfo.credit.businessKey,
                document_number: confirmOrderInfo.credit.documentNumber,
                approved_amount: confirmOrderInfo.credit.approvedAmount,
                code: confirmOrderInfo.credit.code,
                period: confirmOrderInfo.credit.period,
                updated_at: new Date()
            });
    }

    /**
     * Update customer info
     */
    public async updateCustomerData(orderId: number, confirmOrderInfo: ConfirmOrderInfoType): Promise <void>
    {
        await this.dbConnection.client.table('customers')
            .where('order_id', orderId)
            .first()
            .update({
                name: confirmOrderInfo.client.name,
                surname: confirmOrderInfo.client.surname,
                patronymic: confirmOrderInfo.client.patronymic,
                iin: confirmOrderInfo.client.iin,
                phone: confirmOrderInfo.client.phone,
                updated_at: new Date()
            });
    }
}
