import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../config/firebase';

type FirestoreFilter = any;
type SortSpec = Record<string, 1 | -1>;

type StoredDocument = Record<string, any> & {
    _id: string;
    id: string;
    toObject: () => Record<string, any>;
};

function getDb() {
    return getFirebaseAdmin().firestore();
}

function asComparable(value: unknown): unknown {
    if (value instanceof Timestamp) return value.toDate();
    return value;
}

function normalizeValue(value: unknown): unknown {
    if (value instanceof Timestamp) return value.toDate();
    if (Array.isArray(value)) return value.map(normalizeValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]));
    }
    return value;
}

function matchesFilter(document: StoredDocument, filter: FirestoreFilter): boolean {
    return Object.entries(filter).every(([field, expected]) => {
        const actual: any = asComparable(document[field]);
        if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
            return Object.entries(expected as Record<string, unknown>).every(([operator, operand]) => {
                const comparableOperand: any = asComparable(operand);
                switch (operator) {
                    case '$gte': return actual >= comparableOperand;
                    case '$gt': return actual > comparableOperand;
                    case '$lte': return actual <= comparableOperand;
                    case '$lt': return actual < comparableOperand;
                    case '$ne': return actual !== comparableOperand;
                    case '$in': return Array.isArray(comparableOperand) && comparableOperand.includes(actual);
                    default: return false;
                }
            });
        }
        return actual === asComparable(expected);
    });
}

function hydrate(snapshot: FirebaseFirestore.DocumentSnapshot): StoredDocument {
    const data = normalizeValue(snapshot.data() || {}) as Record<string, any>;
    const document = {
        ...data,
        _id: snapshot.id,
        id: snapshot.id,
    } as StoredDocument;
    document.toObject = () => ({ ...document });
    return document;
}

async function readCollection<T>(collectionName: string, filter: FirestoreFilter): Promise<T[]> {
    const snapshot = await getDb().collection(collectionName).get();
    return snapshot.docs.map(hydrate).filter((document) => matchesFilter(document, filter)) as T[];
}

class FirestoreQuery<T> implements PromiseLike<T[]> {
    private sortSpec: SortSpec = {};
    private skipCount = 0;
    private limitCount?: number;

    constructor(private readonly collectionName: string, private readonly filter: FirestoreFilter) { }

    sort(spec: SortSpec): this {
        this.sortSpec = spec;
        return this;
    }

    skip(count: number): this {
        this.skipCount = count;
        return this;
    }

    limit(count: number): this {
        this.limitCount = count;
        return this;
    }

    lean(): this {
        return this;
    }

    async execute(): Promise<T[]> {
        let documents = await readCollection<T>(this.collectionName, this.filter);
        const entries = Object.entries(this.sortSpec);
        if (entries.length) {
            documents.sort((left: any, right: any) => {
                for (const [field, direction] of entries) {
                    const a: any = asComparable(left[field]);
                    const b: any = asComparable(right[field]);
                    if (a === b) continue;
                    return (a > b ? 1 : -1) * direction;
                }
                return 0;
            });
        }
        documents = documents.slice(this.skipCount);
        if (this.limitCount !== undefined) documents = documents.slice(0, this.limitCount);
        return documents;
    }

    then<TResult1 = T[], TResult2 = never>(
        onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }
}

class FirestoreSingleQuery<T> implements PromiseLike<T | null> {
    private readonly query: FirestoreQuery<T>;

    constructor(collectionName: string, filter: FirestoreFilter) {
        this.query = new FirestoreQuery<T>(collectionName, filter);
    }

    sort(spec: SortSpec): this {
        this.query.sort(spec);
        return this;
    }

    lean(): this {
        this.query.lean();
        return this;
    }

    async execute(): Promise<T | null> {
        return (await this.query.execute())[0] || null;
    }

    then<TResult1 = T | null, TResult2 = never>(
        onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }
}

function removeUndefined(value: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

export class FirestoreModel<T> {
    constructor(private readonly collectionName: string) { }

    async create(data: Record<string, any>): Promise<T> {
        const reference = getDb().collection(this.collectionName).doc();
        const now = new Date();
        const document = removeUndefined({ ...data, createdAt: data.createdAt || now, updatedAt: now });
        await reference.set(document);
        return hydrate({ id: reference.id, data: () => document } as unknown as FirebaseFirestore.DocumentSnapshot) as T;
    }

    find(filter: FirestoreFilter = {}): FirestoreQuery<T> {
        return new FirestoreQuery<T>(this.collectionName, filter);
    }

    findOne(filter: FirestoreFilter = {}): FirestoreSingleQuery<T> {
        return new FirestoreSingleQuery<T>(this.collectionName, filter);
    }

    async findById(id: string | string[]): Promise<T | null> {
        id = Array.isArray(id) ? id[0] : id;
        const snapshot = await getDb().collection(this.collectionName).doc(id).get();
        return snapshot.exists ? hydrate(snapshot) as T : null;
    }

    async findByIdAndUpdate(id: string | string[], update: Record<string, any>, options: { new?: boolean; runValidators?: boolean } = {}): Promise<T | null> {
        id = Array.isArray(id) ? id[0] : id;
        return this.updateByReference(getDb().collection(this.collectionName).doc(id), update, options);
    }

    async findByIdAndDelete(id: string | string[]): Promise<T | null> {
        id = Array.isArray(id) ? id[0] : id;
        const reference = getDb().collection(this.collectionName).doc(id);
        const snapshot = await reference.get();
        if (!snapshot.exists) return null;
        await reference.delete();
        return hydrate(snapshot) as T;
    }

    async findOneAndUpdate(filter: FirestoreFilter, update: Record<string, any>, options: { new?: boolean; upsert?: boolean; runValidators?: boolean } = {}): Promise<T | null> {
        const document = (await this.find(filter).limit(1).execute())[0] as StoredDocument | undefined;
        if (!document && options.upsert) return this.create({ ...filter, ...update });
        if (!document) return null;
        return this.updateByReference(getDb().collection(this.collectionName).doc(document._id), update, options);
    }

    async findOneAndDelete(filter: FirestoreFilter): Promise<T | null> {
        const document = (await this.find(filter).limit(1).execute())[0] as StoredDocument | undefined;
        if (!document) return null;
        return this.findByIdAndDelete(document._id);
    }

    async countDocuments(filter: FirestoreFilter = {}): Promise<number> {
        return (await readCollection<T>(this.collectionName, filter)).length;
    }

    async updateMany(filter: FirestoreFilter, update: Record<string, any>): Promise<{ modifiedCount: number }> {
        const documents = (await this.find(filter).execute()) as StoredDocument[];
        await Promise.all(documents.map((document) => this.updateByReference(getDb().collection(this.collectionName).doc(document._id), update, { new: true })));
        return { modifiedCount: documents.length };
    }

    private async updateByReference(reference: FirebaseFirestore.DocumentReference, update: Record<string, any>, options: { new?: boolean } = {}): Promise<T | null> {
        const before = await reference.get();
        if (!before.exists) return null;
        const updatedData = removeUndefined({ ...before.data(), ...update, updatedAt: new Date() });
        await reference.set(updatedData);
        return hydrate(options.new === false ? before : { id: reference.id, data: () => updatedData } as unknown as FirebaseFirestore.DocumentSnapshot) as T;
    }
}

export { FieldPath };
