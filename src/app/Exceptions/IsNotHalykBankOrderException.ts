import Exception from 'sosise-core/build/Exceptions/Exception';
import ExceptionCustomType from '../Types/ExceptionForHalykBank';

export default class IsNotHalykBankOrderException extends Exception {

    // This variables are optional, you may remove them
    protected httpCode = 404;
    protected code = 404;

    /**
     * Constructor
     */
    constructor(message: string) {
        super(message);

    }

    /**
     * Handle exception
     */
    public handle(exception: this): ExceptionCustomType {
        const response: ExceptionCustomType = {
            code: this.code,
            httpCode: this.httpCode,
            message: exception.message
        };
        return response;
    }
}
