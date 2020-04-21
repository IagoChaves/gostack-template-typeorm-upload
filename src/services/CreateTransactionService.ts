// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: 'string';
}

class CreateTransactionService {
  public async execute({
    category,
    type,
    title,
    value,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Only income or outcome types avaiable', 400);
    }
    if (
      type === 'outcome' &&
      (await transactionRepository.getBalance()).total < value
    ) {
      throw new AppError('Insufficient founds', 400);
    }
    const categoryRepository = getRepository(Category);

    let categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryExists);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category: categoryExists,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
