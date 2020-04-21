import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const transactionExists = await transactionRepository.findOne({
      where: { id },
    });
    if (!transactionExists) {
      throw new AppError('Transaction does not exists', 401);
    }
    await transactionRepository.remove(transactionExists);
  }
}

export default DeleteTransactionService;
