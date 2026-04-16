/**
 * asyncHandler: A wrapper function to handle asynchronous route handlers.
 * It eliminates the need for try-catch blocks in every controller.
 * * @param {Function} requestHandler - The async function (controller) to be wrapped.
 * @returns {Function} - A middleware function that Express can execute.
 */

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Promise.resolve executes the controller and if it fails,
        // it catches the error and passes it to the next error middleware.
        Promise.resolve(requestHandler(req, res, next))
               .catch((err) => next(err)); 
    };
};

export { asyncHandler };