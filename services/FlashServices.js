class FlashMiddleware {
    static handle(req, res, next) {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.confirm_msg = req.flash('confirm_msg');
        res.locals.error = req.flash('error_msg');
        res.locals.user = req.user || null;
        res.locals.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
        next();
    };
}

export default FlashMiddleware;