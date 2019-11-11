import { Subscription } from 'rxjs';
import { State } from 'store/state';
import { Redirect } from 'aurelia-router';
import { SteemEngine } from 'services/steem-engine';
import { autoinject, TaskQueue } from 'aurelia-framework';
import { loadTokens, loadBalances } from 'common/steem-engine';

import firebase from 'firebase/app';
import { dispatchify, Store } from 'aurelia-store';
import { getCurrentFirebaseUser, loadAccountBalances, loadTokensList } from 'store/actions';
import { DialogService } from 'aurelia-dialog';


@autoinject()
export class PendingUnstakes {    
    private transactions: IPendingUnstakeTransaction[] = [];
    private username: any;
    private loading = false;
    private state: State;
    private subscription: Subscription;

    private transactionsTable: HTMLTableElement;
    
    constructor(private se: SteemEngine, private store: Store<State>) {
        this.subscription = this.store.state.subscribe((state: State) => {
            if (state) {
                this.state = state;
            }
        });
    }

    unbind() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    attached() {        
        this.loadTable();        
    }

    loadTable() {
        // @ts-ignore
        $(this.transactionsTable).DataTable({
            bInfo: false,
            paging: false,
            searching: false,
            ordering: false
        });
    }

    async loadStakeData() {
        if (this.state.tokens.length == 0) {
            await dispatchify(loadTokensList)();
            await dispatchify(loadAccountBalances)();
        }

        this.username = this.state.account.name;
        this.transactions = await this.se.loadPendingUnstakes(this.username);
    }

    async cancelUnstake(txId) {
        this.loading = true;

        try {
            await this.se.cancelUnstake(txId);
            await this.loadStakeData();
        } catch (e) {
            console.log(e);
        }        

        this.loading = false;        
    }

    async canActivate() {
        try {
            await this.loadStakeData();            
        } catch {
            return new Redirect('');
        }
    }
}