import Validator from 'validatorjs';
import ValidationException from 'sosise-core/build/Exceptions/Validation/ValidationException';

/**
 * If you need more validation rules, see: https://github.com/mikeerickson/validatorjs
 */
export default class CreateOrderUnifier {

    private params: any;
    public  orderNumber: string;

    /**
     * Constructor
     */
    constructor(params: any) {
        // Remember incoming params
        this.params = params;

        // Validate, await is important otherwise we could not catch the exception
        this.validate();

        // Map data
        this.map();
    }

    /**
     * Request data validation
     */
    private validate() {
        // Create validator
        const validator = new Validator(this.params, {
            order_number: ['required', 'numeric', 'min:1'],
        });

        // If it fails throw exception
        if (validator.fails()) {
            throw new ValidationException('Validation exception', (validator.errors.all() as any));
        }
    }

    /**
     * Request data mapping
     */
    private map() {
        this.orderNumber = this.params.order_number;
    }
}
