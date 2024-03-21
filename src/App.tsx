import './App.css';
import React from 'react';
import axios, { CancelTokenSource, Canceler } from 'axios';

type Props = {};

type State = {
	query: string;
	pageNumber: number;
	isLoading: boolean;
	error: boolean;
	books: any[];
	hasMore: boolean;
};

class App extends React.Component<Props, State> {
	source: CancelTokenSource = axios.CancelToken.source();
	storage: string | null = sessionStorage.getItem('books');
	observer: React.MutableRefObject<any> = React.createRef();

	constructor(props: Props) {
		super(props);
		this.state = {
			query: 'berthold',
			pageNumber: 1,
			isLoading: false,
			error: false,
			books:
				this.storage && this.storage !== '[ ]'
					? JSON.parse(this.storage)
					: [],
			hasMore: true,
		};
	}

	get query(): string {
		return this.state.query;
	}

	set query(query: string) {
		this.setState({ query });
	}

	get pageNumber(): number {
		return this.state.pageNumber;
	}

	set pageNumber(pageNumber: number) {
		this.setState({ pageNumber });
	}

	get isLoading(): boolean {
		return this.state.isLoading;
	}

	set isLoading(isLoading: boolean) {
		this.setState({ isLoading });
	}

	get error(): boolean {
		return this.state.error;
	}

	set error(error: boolean) {
		this.setState({ error });
	}

	get books(): any[] {
		return this.state.books;
	}

	set books(books: any[]) {
		this.setState({ books });
	}

	get hasMore(): boolean {
		return this.state.hasMore;
	}

	set hasMore(hasMore: boolean) {
		this.setState({ hasMore });
	}

	componentDidMount(): void {
		console.log('componentDidMount');
		if (!sessionStorage.getItem('books')) {
			console.log('no books');
			this.handleAxios();
		} else {
			console.log('books');
		}
	}

	componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		snapshot?: any
	): void {
		if (prevState.query !== this.query) {
			console.log('componentDidUpdate');
			this.handleAxios();
		}
	}

	handleAxios(): void {
		this.error = false;
		this.isLoading = true;
		axios({
			method: 'GET',
			url: `http://openlibrary.org/search.json`,
			params: {
				q: this.query,
				page: this.pageNumber,
			},
			// headers: {
			// 	'Cache-Control': 'public, max-age=3600',
			// },
			cancelToken: this.source.token,
		})
			.then((res) => {
				console.log(this.books);
				if (res.data.docs.length !== 0) {
					this.books = [
						...new Set([
							...this.books,
							...res.data.docs.map((b: { title: any }) => {
								if (b.title !== undefined) return b.title;
							}),
						]),
						sessionStorage.removeItem('books'),
						sessionStorage.setItem(
							'books',
							JSON.stringify(this.books)
						),
					];
				}
				this.hasMore = res.data.docs.length > 0;
				this.isLoading = false;
			})
			.catch((err) => {
				this.error = true;
				this.isLoading = false;
				if (axios.isCancel(err)) {
					console.log('Request canceled', err.message);
				}
			});
	}

	// handleSearch(e: any) {
	// 	this.source.cancel();
	// 	this.query = e.target.value;
	// }

	handleRef(node: HTMLDivElement | null): void {
		if (this.isLoading) return;
		if (this.observer.current) this.observer.current.disconnect();
		this.observer.current = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && this.hasMore) {
				this.pageNumber++;
				this.handleAxios();
			}
		});
		if (node) this.observer.current.observe(node);
		console.log('this.observer', this.observer);
	}

	render(): React.JSX.Element {
		return (
			<>
				<h1>Intersection Observer Test</h1>
				{/* <input
					type='text'
					onChange={(e) => this.handleSearch(e)}
				/> */}
				{this.isLoading && <div>Loading...</div>}
				{this.error && <div>Error</div>}
				{!this.isLoading && !this.error && (
					<div>Number of books: {this.books.length}</div>
				)}
				<hr />
				<br />
				<div className='col'>
					{this.books.map((b, i) => {
						if (this.books.length === i + 1) {
							return (
								<div
									className='book'
									key={i}
									ref={(e) => this.handleRef(e)}
								>
									{i}. {b}
								</div>
							);
						} else {
							return (
								<div
									className='book'
									key={i}
								>
									{i}. {b}
								</div>
							);
						}
					})}
				</div>
			</>
		);
	}
}
export default App;
