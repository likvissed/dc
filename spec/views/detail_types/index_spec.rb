require 'rails_helper'

RSpec.describe "detail_types/index", type: :view do

  let(:detail_types) { create_list(:detail_type, 3) }
  before do
    assign(:detail_types, Kaminari.paginate_array(detail_types).page(1))
    render
  end

  it "renders name for each record" do
    expect(rendered).to include('Type_')
  end

  it "renders link to delete the record" do
    expect(rendered).to have_selector("a[href='#{detail_type_path(detail_types.first.id)}']")
  end

  it "renders link to edit the record" do
    expect(rendered).to have_selector("a[href='#{detail_type_path(detail_types.first.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(rendered).to have_selector("form[action='#{new_detail_type_path}']")
  end

end
