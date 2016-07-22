require 'rails_helper'

RSpec.describe "node_roles/index", type: :view do

  let(:node_roles) { create_list(:node_role, 3) }
  before do
    assign(:node_roles, node_roles)
    render
  end

  it "renders name for each record" do
    expect(rendered).to include('Node_')
  end

  it "renders link to delete the record" do
    expect(rendered).to have_selector("a[href='#{node_role_path(node_roles.first.id)}']")
  end

  it "renders link to edit the record" do
    expect(rendered).to have_selector("a[href='#{node_role_path(node_roles.first.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(rendered).to have_selector("form[action='#{new_node_role_path}']")
  end

end