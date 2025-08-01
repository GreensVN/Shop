const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const nodemailer = require('nodemailer');
const validator = require('validator');

// Load env vars
dotenv.config({ path: './config.env' });

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// --- BẮT ĐẦU CẤU HÌNH CORS ---

// 1. Định nghĩa origin được phép (KHÔNG bao gồm đường dẫn /Shop/)
const allowedOrigins = [
  'https://greensvn.github.io'
];

// 2. Tạo các tùy chọn cho CORS
const corsOptions = {
  origin: function (origin, callback) {
    // In ra origin thực tế để debug trong log của Render
    console.log('REQUEST ORIGIN:', origin);

    // Cho phép các yêu cầu từ tên miền trong danh sách hoặc các yêu cầu không có origin (như Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin này không được phép bởi chính sách CORS'));
    }
  },
  credentials: true,
};

// 3. Sử dụng CORS để xử lý tất cả các request, bao gồm cả OPTIONS (pre-flight)
app.use(cors(corsOptions));

// --- KẾT THÚC CẤU HÌNH CORS ---


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    sslValidate: true,
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => console.error('Error DB:', err));

// Models
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  avatarText: {
    type: String,
    default: function() {
      return this.name.charAt(0).toUpperCase();
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  balance: {
    type: Number,
    default: 0,
  },
  depositHistory: [
    {
      amount: Number,
      date: Date,
      cardType: String,
      cardNumber: String,
      status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending',
      },
    },
  ],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  registerDate: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A product must have a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'A product must have a description'],
  },
  price: {
    type: Number,
    required: [true, 'A product must have a price'],
  },
  oldPrice: Number,
  images: [String],
  category: {
    type: String,
    enum: ['plants', 'pets', 'game-accounts', 'services'],
    required: [true, 'A product must belong to a category'],
  },
  features: [String],
  detailedDescription: String,
  sales: {
    type: Number,
    default: 0,
  },
  badge: {
    type: String,
    enum: ['HOT', 'NEW', 'SALE', null],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model('Product', productSchema);

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review cannot be empty'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Review must belong to a product'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name avatarText',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user'],
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
  },
  amount: {
    type: Number,
    required: [true, 'Transaction must have an amount'],
  },
  type: {
    type: String,
    enum: ['deposit', 'purchase', 'withdrawal'],
    required: [true, 'Transaction must have a type'],
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  cardType: String,
  cardNumber: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email',
  }).populate({
    path: 'product',
    select: 'title price',
  });

  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Email Class
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Shop Grow A Garden <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, text) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordReset() {
    await this.send(
      'Your password reset token (valid for 10 min)',
      `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${this.url}.\nIf you didn't forget your password, please ignore this email!`
    );
  }
}

const sendEmail = async options => {
  const email = new Email(options.user, options.url);
  await email.send(options.subject, options.message);
};

// Utility functions
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Auth Controller
const authController = {
  signup: catchAsync(async (req, res, next) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newUser, 201, res);
  }),

  login: catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    createSendToken(user, 200, res);
  }),

  logout: (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
  },

  protect: catchAsync(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'User recently changed password! Please log in again.',
      });
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }),

  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to perform this action',
        });
      }

      next();
    };
  },

  forgotPassword: catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address.',
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    try {
      await sendEmail({
        user,
        subject: 'Your password reset token (valid for 10 min)',
        message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'fail',
        message: 'There was an error sending the email. Try again later!',
      });
    }
  }),

  resetPassword: catchAsync(async (req, res, next) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired',
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  }),

  updatePassword: catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is wrong.',
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  }),
};

// User Controller
const userController = {
  getMe: (req, res, next) => {
    req.params.id = req.user.id;
    next();
  },

  getUser: catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  }),

  updateMe: catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  }),

  deleteMe: catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),

  deposit: catchAsync(async (req, res, next) => {
    const { amount, cardType, cardNumber } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { balance: amount },
        $push: {
          depositHistory: {
            amount,
            cardType,
            cardNumber: cardNumber.slice(-4),
            status: 'success',
            date: Date.now()
          }
        }
      },
      { new: true }
    );

    await Transaction.create({
      user: req.user.id,
      amount,
      type: 'deposit',
      status: 'completed',
      cardType,
      cardNumber: cardNumber.slice(-4)
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  }),

  getTransactions: catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions
      }
    });
  }),

  getAllUsers: catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  }),

  updateUser: catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  }),

  deleteUser: catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),
};

// Product Controller
const productController = {
  getAllProducts: catchAsync(async (req, res, next) => {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const products = await query;

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
      },
    });
  }),

  getProduct: catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  }),

  createProduct: catchAsync(async (req, res, next) => {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct,
      },
    });
  }),

  updateProduct: catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  }),

  deleteProduct: catchAsync(async (req, res, next) => {
    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),

  getProductReviews: catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ product: req.params.id });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews,
      },
    });
  }),
};

// Review Controller
const reviewController = {
  getAllReviews: catchAsync(async (req, res, next) => {
    const reviews = await Review.find();

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews,
      },
    });
  }),

  createReview: catchAsync(async (req, res, next) => {
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user.id;

    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  }),

  getReview: catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  }),

  updateReview: catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  }),

  deleteReview: catchAsync(async (req, res, next) => {
    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),

  setProductUserIds: (req, res, next) => {
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
  },
};

// Transaction Controller
const transactionController = {
  getAllTransactions: catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find();

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  }),

  createTransaction: catchAsync(async (req, res, next) => {
    const newTransaction = await Transaction.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        transaction: newTransaction,
      },
    });
  }),

  getTransaction: catchAsync(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  }),

  updateTransaction: catchAsync(async (req, res, next) => {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  }),

  deleteTransaction: catchAsync(async (req, res, next) => {
    await Transaction.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }),
};

// Routes
app.post('/api/v1/users/signup', authController.signup);
app.post('/api/v1/users/login', authController.login);
app.get('/api/v1/users/logout', authController.logout);
app.post('/api/v1/users/forgotPassword', authController.forgotPassword);
app.patch('/api/v1/users/resetPassword/:token', authController.resetPassword);

// Protected routes
app.use(authController.protect);

app.patch('/api/v1/users/updateMyPassword', authController.updatePassword);
app.get('/api/v1/users/me', userController.getMe, userController.getUser);
app.patch('/api/v1/users/updateMe', userController.updateMe);
app.delete('/api/v1/users/deleteMe', userController.deleteMe);
app.post('/api/v1/users/deposit', userController.deposit);
app.get('/api/v1/users/transactions', userController.getTransactions);

// Admin only routes
app.use(authController.restrictTo('admin'));

app.get('/api/v1/users', userController.getAllUsers);
app.get('/api/v1/users/:id', userController.getUser);
app.patch('/api/v1/users/:id', userController.updateUser);
app.delete('/api/v1/users/:id', userController.deleteUser);

// Product routes
app.get('/api/v1/products', productController.getAllProducts);
app.post('/api/v1/products', productController.createProduct);
app.get('/api/v1/products/:id', productController.getProduct);
app.patch('/api/v1/products/:id', productController.updateProduct);
app.delete('/api/v1/products/:id', productController.deleteProduct);

// Review routes
app.get('/api/v1/reviews', reviewController.getAllReviews);
app.post('/api/v1/reviews', reviewController.createReview);
app.get('/api/v1/reviews/:id', reviewController.getReview);
app.patch('/api/v1/reviews/:id', reviewController.updateReview);
app.delete('/api/v1/reviews/:id', reviewController.deleteReview);

// Product reviews
app.get('/api/v1/products/:productId/reviews', productController.getProductReviews);
app.post(
  '/api/v1/products/:productId/reviews',
  reviewController.setProductUserIds,
  reviewController.createReview
);

// Transaction routes
app.get('/api/v1/transactions', transactionController.getAllTransactions);
app.post('/api/v1/transactions', transactionController.createTransaction);
app.get('/api/v1/transactions/:id', transactionController.getTransaction);
app.patch('/api/v1/transactions/:id', transactionController.updateTransaction);
app.delete('/api/v1/transactions/:id', transactionController.deleteTransaction);

// Start server
const port = process.env.PORT || 2296;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl} - From: ${req.headers.origin || req.ip}`);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});
