// adminRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/AuthServices.js';

class AdminRoutes {
  constructor(userModel, packageModel) {
    this.router = express.Router();
    this.userModel = userModel;
    this.auth = new AuthService();
    this.packageModel = packageModel;
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/dashboard', this.auth.reqAuth, this.showDashboard.bind(this));

    this.router.get('/api/stats', async (req, res) => {
        try {
          const [[{ totalUsers }]] = await this.userModel.db.query('SELECT COUNT(*) as totalUsers FROM users');
          const [[{ totalPackages }]] = await this.packageModel.db.query('SELECT COUNT(*) as totalPackages FROM packages');
          const [[{ totalOrders }]] = await this.userModel.db.query('SELECT COUNT(*) as totalOrders FROM orders');
            
          res.json({
            totalUsers,
            totalPackages,
            totalOrders
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
    });

    // User routes
    this.router.get('/api/users', this.getUsers.bind(this));
    this.router.post('/api/users', this.createUser.bind(this));
    this.router.put('/api/users/:id', this.updateUser.bind(this));
    this.router.delete('/api/users/:id', this.deleteUser.bind(this));

    // Package routes
    this.router.get('/api/packages', this.getPackages.bind(this));
    this.router.post('/api/packages', this.createPackage.bind(this));
    this.router.put('/api/packages/:id', this.updatePackage.bind(this));
    this.router.delete('/api/packages/:id', this.deletePackage.bind(this));

    // Order routes
    this.router.get('/api/orders', this.getOrders.bind(this));
    this.router.delete('/api/orders/:id', this.deleteOrder.bind(this));
  }

  async getUsers(req, res) {
    try {
      const [users] = await this.userModel.db.query(
        'SELECT id, username, email, is_admin, is_verified FROM users'
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async showDashboard(req, res) {
    res.render('adminDashboard', {
        title: 'Admin Dashboard',
        layout: 'layouts/main',
    });
  }

  async createUser(req, res) {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.userModel.db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]
    );
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    let updateQuery = 'UPDATE users SET username = ?, email = ?';
    let params = [username, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await this.userModel.db.query(updateQuery, params);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async deleteUser(req, res) {
  try {
    const { id } = req.params;
    await this.userModel.db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async getPackages(req, res) {
  try {
    const [packages] = await this.packageModel.db.query('SELECT * FROM packages');
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async createPackage(req, res) {
  try {
    const { name, price } = req.body;
    await this.packageModel.db.query(
      'INSERT INTO packages (name, price) VALUES (?, ?)',
      [name, price]
    );
    res.json({ message: 'Package created successfully' });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async updatePackage(req, res) {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    await this.packageModel.db.query(
      'UPDATE packages SET name = ?, price = ? WHERE id = ?',
      [name, price, id]
    );
    res.json({ message: 'Package updated successfully' });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async deletePackage(req, res) {
  try {
    const { id } = req.params;
    await this.packageModel.db.query('DELETE FROM packages WHERE id = ?', [id]);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async getOrders(req, res) {
  try {
    const [orders] = await this.userModel.db.query(`
      SELECT o.id, u.username, p.name as package_name, o.order_date
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN packages p ON o.package_id = p.id
      ORDER BY o.order_date DESC
    `);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async deleteOrder(req, res) {
  try {
    const { id } = req.params;
    await this.userModel.db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
}

export default (userModel, packageModel) => new AdminRoutes(userModel, packageModel).router;