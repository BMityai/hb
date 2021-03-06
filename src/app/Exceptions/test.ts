import Exception from 'sosise-core/build/Exceptions/Exception';
import ExceptionResponse from 'sosise-core/build/Types/ExceptionResponse';

export default class Test extends Exception {

    // This variables are optional, you may remove them
    public exampleVariable: string;
    protected httpCode = 500;
    protected code = 3001;

    /**
     * Constructor
     */
    constructor(message: string, exampleVariable: string) {
        super(message);

        // This is just an example
        this.exampleVariable = exampleVariable;
    }

    /**
     * Handle exception
     */
    public handle(exception: this): ExceptionResponse {
        const response: ExceptionResponse = {
            code: this.code, // optional
            httpCode: this.httpCode, // optional
            message: exception.message,
            data: {
                yourCustomData: this.exampleVariable
            }
        };
        return response;
    }
}
