require 'rails_helper'

RSpec.describe NodeRolesController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to node_roles_path
    end
  end

  describe "#index" do
    subject { get :index }
    before { subject }

    it "must create instance variable" do
      expect(assigns(:node_roles)).to be_kind_of(NodeRole::ActiveRecord_Relation)
    end

    it "renders index page" do
      expect(subject).to render_template(:index)
    end
  end

  describe "#new" do
    subject { get :new }

    it "must create a new variable" do
      subject
      expect(assigns(:node_role)).to be_a_new(NodeRole)
    end

    it "renders new page" do
      expect(subject).to render_template(:new)
    end
  end

  describe "#create" do
    context "when node_role was created" do
      let(:node_role) { attributes_for(:node_role) }
      subject { post :create, node_role: node_role }

      it "changes count of NodeRole" do
        expect { subject }.to change { NodeRole.count }.by(1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when node_role was not created" do
      let(:invalid_node_role) { attributes_for(:invalid_node_role) }
      subject { post :create, node_role: invalid_node_role }

      it "must not change count of NodeRole" do
        expect { subject }.to_not change { DetailType.count }
      end

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#update" do
    let(:node_role_old) { create(:node_role) }

    context "when node_role was updated" do
      let(:node_role_new) { attributes_for(:node_role) }
      subject { put :update, name: node_role_old.name, node_role: node_role_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when node_role was not updated" do
      let(:invalid_node_role) { attributes_for(:invalid_node_role) }
      subject { put :update, name: node_role_old.name, node_role: invalid_node_role }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when node_role was destroyed" do
      let!(:node_role) { create(:node_role) }
      subject { delete :destroy, id: node_role.id }

      it "changes count of NodeRole" do
        expect { subject }.to change { NodeRole.count }.by(-1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
