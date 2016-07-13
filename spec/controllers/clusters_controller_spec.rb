require 'rails_helper'

RSpec.describe ClustersController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to clusters_path
    end
  end

  describe "#index" do
    let(:cluster) { create(:cluster) }

    context "when sends html request" do
      subject { get :index }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:clusters)).to be_kind_of(Cluster::ActiveRecord_Relation)
      end

      it "render index page" do
        expect(subject).to render_template :index
      end
    end

    context "when sends json request" do
      let(:expected_cluster) do
        cluster = Cluster.select(:id, :name)
        cluster.as_json.each do |s|
          s['DT_RowId'] = s['id']
          s['del']      = "<a href='/clusters/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
      end
      subject { get :index, format: :json }
      before { subject }

      it "must create instance variable" do
        expect(assigns(:clusters)).to be_kind_of(Cluster::ActiveRecord_Relation)
      end

      it "sends cluster data" do
        parser = JSON.parse(subject.body)
        expect(parser["data"]).to eq expected_cluster.as_json
      end
    end
  end

  describe "#show" do
    context "when sends json request" do
      let(:cluster) { create(:cluster) }
      let(:expected_cluster) do
        expect_cluster = Cluster.find(cluster.id)
        expect_cluster.as_json(
          include: {
            cluster_details: {
              only: [],
              include: {
                server: { only: :name },
                node_role: { only: :name } }
            }
          },
          except: [:id, :created_at, :updated_at]
        )
      end
      subject { get :show, format: :json, id: cluster.id }

      it "sends the server data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_cluster
      end
    end
  end

  describe "#new" do
    context "when sends html request" do
      subject { get :new }

      it "must create a new variable" do
        subject
        expect(assigns(:cluster)).to be_a_new(Cluster)
      end

      it "renders new page" do
        expect(subject).to render_template(:new)
      end
    end

    context "when sends json request" do
      let!(:server) { create(:server) }
      let!(:cluster) { create(:cluster) }
      let(:servers) { Server.select(:id, :name) }
      let(:node_roles) { NodeRole.select(:id, :name) }
      let(:expected_cluster) { { servers: servers, node_roles: node_roles } }
      subject { get :new, format: :json }

      it "sends the empty(new) cluster data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_cluster.as_json
      end
    end
  end

  describe "#create" do
    context "when cluster was created" do
      let!(:server) { create(:server) }
      let!(:node_role_1) { create(:node_role) }
      let!(:node_role_2) { create(:node_role) }
      let(:cluster) { attributes_for(:cluster, cluster_details_attributes: [
        { id: "", _destroy: "", server_id: server.id, node_role_id: node_role_1.id },
        { id: "", _destroy: "", server_id: server.id, node_role_id: node_role_2.id }
      ]) }
      subject { post :create, cluster: cluster }

      it "changes count of Cluster" do
        expect { subject }.to change { Cluster.count }.by(1)
      end

      it "changes count of ClusterDetail" do
        expect { subject }.to change { ClusterDetail.count }.by(2)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server was not created" do
      let(:invalid_cluster) { build(:invalid_cluster).attributes }
      subject { post :create, cluster: invalid_cluster }

      it "must not change count of Cluster" do
        expect { subject }.to_not change { Cluster.count }
      end

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#edit" do
    let(:current_cluster) { create(:cluster) }

    context "when sends html request" do
      subject{ get :edit, name: current_cluster.name}
      before { subject }

      it "must create instance variable" do
        expect(assigns(:cluster)).to be_kind_of(Cluster)
      end

      it "check data in instance variable" do
        expect(assigns(:cluster)).to eq current_cluster
      end

      it "render edit page" do
        expect(subject).to render_template(:edit)
      end
    end

    context "when sends json request" do
      let!(:server) { create(:server) }
      let(:servers) { Server.select(:id, :name) }
      let(:node_roles) { NodeRole.select(:id, :name) }
      let(:expected_cluster) do
        {
          cluster_details: current_cluster.cluster_details.as_json(
                         include: {
                           server: { only: [:id, :name] },
                           node_role: { only: [:id, :name] } },
                         except: [:created_at, :updated_at]),
          servers: servers,
          node_roles: node_roles
        }
      end
      subject { get :edit, format: :json, name: current_cluster.name }

      it "sends the current cluster data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_cluster.as_json
      end
    end
  end

  describe "#update" do
    let(:cluster_old) { create(:cluster) }

    context "when cluster was updated" do
      let(:cluster_new) { build(:cluster).attributes }
      subject { put :update, name: cluster_old.name, cluster: cluster_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when cluster was not updated" do
      let(:invalid_cluster) { build(:invalid_cluster).attributes }
      subject { put :update, name: cluster_old.name, cluster: invalid_cluster }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  context "when cluster was(or not) destroyed" do
    context "when server_type was destroyed" do
      let!(:cluster) { create(:cluster) }
      subject { delete :destroy, id: cluster.id }

      it "changes count of Cluster" do
        expect { subject }.to change { Cluster.count }.by(-1)
      end

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
