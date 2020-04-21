import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const contactReadStream = fs.createReadStream(filepath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !value || !type) return;

      categories.push(category);
      transactions.push({ title, value, type, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoryExists = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const categoriesTitles = categoryExists.map(
      (category: Category) => category.title,
    );
    console.log(categoriesTitles);
    const addCategoryTitles = categories
      .filter(category => !categoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);
    console.log(addCategoryTitles);
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    console.log(newCategories);
    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...categoryExists];
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    console.log(createdTransactions);
    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filepath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
